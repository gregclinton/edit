from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
import subprocess, time, os

with open(os.path.expanduser('~/keys'), 'r') as file:
    for line in file.read().splitlines():
        k, v = line.split('=')
        os.environ[k] = v

builder = StateGraph(MessagesState)

def cmd(line):
    """
        run a shell command
    """
    print(line, flush = True)
    return subprocess.run(line, shell = True, capture_output = True, text = True).stdout

model = 'gpt-4o-mini'
temperature = 0

def set_model(name):
    """
        gpt-4o, gpt-4o-mini or claude-3-5-sonnet
    """
    print(name, flush = True)
    model = name

def set_temperature(x):
    """
        0 to 1
    """
    print(temperature, flush = True)
    temperature = x

tools = [cmd, set_model, set_temperature]
llm = ChatOpenAI(model = model, temperature = temperature).bind_tools(tools)

def chatbot(state: MessagesState):
    return {'messages': llm.invoke(state['messages'])}

builder.add_node('chatbot', chatbot)
builder.add_node('tools', ToolNode(tools = tools))
builder.add_conditional_edges('chatbot', tools_condition)
builder.add_edge('tools', 'chatbot')
builder.set_entry_point('chatbot')
graph = builder.compile(checkpointer = MemorySaver())

from fastapi import FastAPI, Request

app = FastAPI()

@app.get('/')
async def read_root():
    return 'Not found.'

thread_id = 1

@app.delete('/messages')
async def delete_messages():
   global thread_id
   thread_id += 1

@app.post('/messages')
async def post_prompt(req: Request):
    prompt = (await req.json())['prompt']
    get_stream = lambda messages: graph.stream(messages, {
        'configurable': {'thread_id': str(thread_id)},
        'recursion_limit': 3
    }, stream_mode = 'values')

    for e in get_stream({'messages': [('user', prompt)]}):
        pass

    time.sleep(1)

    answer = '???'
    for event in get_stream(None):
        answer = event['messages'][-1].content

    return { 'answer': answer }
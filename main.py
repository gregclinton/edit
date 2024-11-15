from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain.schema import HumanMessage, SystemMessage
import subprocess, os

with open('keys', 'r') as file:
    for line in file.read().splitlines():
        k, v = line.split('=')
        os.environ[k] = v

model = 'gpt-4o-mini'
temperature = 0

def cmd(line):
    """
        run a shell command
    """
    print(line, flush = True)
    return subprocess.run(line, shell = True, capture_output = True, text = True).stdout

def set_model(name):
    """
        gpt-4o, gpt-4o-mini or claude-3-5-haiku-20241022
    """
    global model
    print(name, flush = True)
    model = name

def set_temperature(x):
    """
        floating point number from 0.0 to 1.0
    """
    global temperature
    print(temperature, flush = True)
    temperature = x

tools = [cmd, set_model, set_temperature]

def chatbot(state: MessagesState):
    instruction = """
        For rendering mathematical expressions, use LaTex with backslash square brackets, \\[ ... \\] for display-style and \\( ... \\) for inline -- no dollar signs.
        Do not escape the backslashes.
    """
    llm = ChatOpenAI(model = model, temperature = temperature).bind_tools(tools)
    return {'messages': llm.invoke([SystemMessage(content = instruction)] + state['messages'])}

builder = StateGraph(MessagesState)
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
thread = {
    'configurable': {'thread_id': str(thread_id)},
    'recursion_limit': 10
}

@app.delete('/thread/current')
async def delete_thread():
    global thread, thread_id
    thread_id += 1
    thread = {
        'configurable': {'thread_id': str(thread_id)},
        'recursion_limit': 10
    }

@app.delete('/messages/last')
async def delete_last_message():
    msgs = graph.get_state(thread).values['messages']

    while not isinstance(msgs[-1], HumanMessage):
        msgs.pop()

    msgs.pop()

@app.post('/messages')
async def post_prompt(req: Request):
    global thread
    prompt = (await req.json())['prompt']
    get_stream = lambda messages: graph.stream(messages, thread, stream_mode = 'values')

    for e in get_stream({'messages': [('user', prompt)]}):
        pass

    while True:
        for event in get_stream(None):
            res = event['messages'][-1]
        if res.content:
            break

    usage = res.response_metadata['token_usage']

    return {
        'content': res.content,
        'model': model,
        'temperature': temperature,
        'tokens': {
            'in': usage['prompt_tokens'],
            'out': usage['completion_tokens'],
            'all': usage['total_tokens']
         }
    }
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
import subprocess, time

builder = StateGraph(MessagesState)
graph = None

def cmd(line):
    """run a shell command"""
    print(line, flush = True)
    return subprocess.run(line, shell = True, capture_output = True, text = True).stdout

tools = [cmd]
llm = None

def chatbot(state: MessagesState):
    return {'messages': [llm.invoke(state['messages'])]}

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

@app.post('/prompt')
async def post_prompt(req: Request):
    prompt = (await req.json())['prompt']
    get_stream = lambda messages: graph.stream(messages, {'configurable': {'thread_id': '1'}}, stream_mode = 'values')

    for e in get_stream({'messages': [('user', prompt)]}):
        pass

    time.sleep(1)

    answer = '???'
    for event in get_stream(None):
        answer = event['messages'][-1].content

    return { 'answer': answer }

def main():
    global llm
    import sys, os, uvicorn

    os.environ['OPENAI_API_KEY'] = sys.argv[1]

    llm = ChatOpenAI(model = 'gpt-4o-mini').bind_tools(tools)

    uvicorn.run(app, host = '0.0.0.0', port = 8000)

if __name__ == "__main__":
    main()    
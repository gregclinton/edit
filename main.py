from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
import subprocess

builder = StateGraph(MessagesState)

def cmd(line):
    """run a shell command"""
    print(line, flush = True)
    return subprocess.run(line, shell = True, capture_output = True, text = True).stdout

tools = [cmd]
llm = ChatOpenAI(model = 'gpt-4o-mini').bind_tools(tools)

def chatbot(state: MessagesState):
    return {'messages': [llm.invoke(state['messages'])]}

builder.add_node('chatbot', chatbot)
builder.add_node('tools', ToolNode(tools = tools))
builder.add_conditional_edges('chatbot', tools_condition)
builder.add_edge('tools', 'chatbot')
builder.set_entry_point('chatbot')
graph = builder.compile(checkpointer = MemorySaver())

from fastapi import FastAPI
import time

app = FastAPI()

@app.get('/')
async def read_root():
    get_stream = lambda messages: graph.stream(messages, {'configurable': {'thread_id': '4'}}, stream_mode = 'values')

    for e in get_stream({'messages': [('user', "in file abc in current directory change all e's to xxx")]}):
        pass

    time.sleep(1)

    msg = '???'
    for event in get_stream(None):
        msg = event['messages'][-1].content

    return {message: msg}
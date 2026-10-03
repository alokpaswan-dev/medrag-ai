# MedRAG AI - Medical RAG Chatbot

MedRAG AI is a medical information chatbot built using Retrieval-Augmented Generation (RAG).

The system retrieves relevant information from a medical knowledge base and uses an LLM to generate a concise answer based on the retrieved context.

## Features

- Medical question answering
- Retrieval-Augmented Generation (RAG)
- Vector search using Pinecone
- HuggingFace embeddings
- Groq LLM
- Medical report image upload
- Medical report analysis
- Source information for answers
- FastAPI backend
- Responsive web interface
- Dark/light mode
- Recent question history

## Tech Stack

### Backend
- Python
- FastAPI
- LangChain
- Pinecone
- HuggingFace
- Groq

### Frontend
- HTML
- CSS
- JavaScript

## How It Works

```text
User Question
      ↓
FastAPI Backend
      ↓
Query Embedding
      ↓
Pinecone Vector Search
      ↓
Relevant Medical Context
      ↓
Groq LLM
      ↓
Generated Answer
      ↓
Frontend
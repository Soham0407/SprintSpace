# SprintSpace AI Integration Guide

You are a senior Full Stack + AI engineer.

Analyze the ENTIRE SprintSpace repository before suggesting anything.

## My Goal

I am responsible for the AI Service of SprintSpace.

The AI backend uses:
- FastAPI
- Google Gemini API
- Python

The frontend is React + TypeScript.
Backend database is Supabase.

Do NOT assume features. Inspect the existing codebase first.

---

## Your Tasks

1. Analyze the entire repository.

2. Find every place where AI should be integrated.

Examples include:
- Workspace page
- AI insights
- Health score
- Risk analysis
- Project analysis
- Smart suggestions
- Kanban/task recommendations
- Timeline predictions
- Deadline risk
- Team productivity insights
- Any other place where AI adds value.

3. For every AI feature explain:
- Which frontend file calls it
- Which backend endpoint should exist
- What request should be sent
- What response should come back
- Which Gemini prompt should generate it

4. Build the AI service step by step.

For every step tell me:
- Which file to create/edit
- Exact code
- Why it is needed
- What I should test before moving on

5. Never skip steps.

Teach me as if I know basic Python and FastAPI but am learning backend development.

6. At every stage tell me:
- What has been completed
- What remains
- Why we are doing the current task

7. If any existing frontend currently uses mock data but should eventually use AI, point it out and explain how to replace the mock with the AI endpoint.

8. Before writing code, always inspect the current implementation so your solution matches the existing architecture and coding style.

Guide me until the entire AI backend is complete and fully integrated with the React frontend.
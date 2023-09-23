# Chat Client Frontend

This is the frontend of a real-time chat application built with React. The application supports real-time messaging using websockets, file sharing, and user authentication.

You can access the live project at [chat-api.link](http://chat-api.link).

Backend Repo: [https://github.com/MarceloDJunior/chat-api](https://github.com/MarceloDJunior/chat-api)

## Key Features

- Real-time messaging: Send and receive messages instantly.
- File sharing: Send single or multiple files via click or drag-and-drop using S3 presigned URLs.
- Contact list: View online and offline users in real-time.
- Message notification: Keep track of new messages with a counter.
- Message status: Track the status of your messages (pending, sent, and read).
- Pagination: Access older messages easily using a "Load More" button.
- Secure access: Authenticate users using Auth0.

## Technologies Used

- React: A JavaScript library for building user interfaces.
- TypeScript: A strict syntactical superset of JavaScript, adding optional static typing.
- SCSS: A preprocessor scripting language that is interpreted or compiled into Cascading Style Sheets (CSS).
- Vite: A build tool that aims to provide a faster and leaner development experience for modern web projects.
- Socket.IO: A JavaScript library for real-time web applications. It enables real-time, bidirectional and event-based communication.
- Auth0: A flexible, drop-in solution to add authentication and authorization services to your applications.
- React Query: A data-fetching and state management library for React applications. It provides essential features for synchronizing, caching, and updating server state in React applications.
- AWS S3: An object storage service that offers industry-leading scalability, data availability, security, and performance. This is used to store files uploaded through the chat.
- AWS CodePipeline & CodeBuild: Fully managed continuous delivery service that helps you automate your release pipelines.
- Framer Motion: A production-ready motion library for React. Used to create animations in the frontend.

## Demo

https://github.com/MarceloDJunior/chat-client/assets/17832776/fcb16260-d1d7-4d47-9d0f-ded2ab68a56e

## Setup and Installation

To run this project, you will need to have Node.js and npm installed.

1. Clone the repository:

```bash
git clone https://github.com/MarceloDJunior/chat-client.git
```

2. Navigate to the project directory:

```bash
cd chat-client
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on the provided `.env.example` and fill in your specific variables.

5. Run the application:

```bash
npm run dev
```

## Deployment

The frontend is automatically deployed to AWS using CodePipeline and CodeBuild. Any changes merged to the main branch will trigger the pipeline, which will build the application and deploy it to AWS.

A `buildspec.yaml` file is included in the repository with the configuration needed for AWS CodeBuild. This file contains a set of build commands and related settings, in YAML format, that CodeBuild uses to run a build.

Please ensure that your AWS credentials are correctly set up and that the AWS environment is properly configured.

## WebSocket Communication

This application uses Socket.IO for real-time, bidirectional and event-based communication. The Socket.IO client is set up to handle incoming messages and send messages to the server.

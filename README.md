# Instance Manager

A modern, clean web interface for managing AWS EC2 instances. This application interacts with an n8n backend to perform Start, Stop, and Status check operations on your instances.

<video src="https://github.com/user-attachments/assets/447d8684-e50f-4288-b458-825ed248a7af" controls width="100%" autoplay loop muted></video>

## Features

- **Control Instances**: Power on and off your EC2 instances with a single click.
- **Real-time Status**: View current state (Running, Stopped, Pending) and uptime.
- **Dynamic Management**: Add and remove instance configurations directly from the UI.
- **Activity Log**: Track recent actions and their outcomes.
- **Local Persistence**: Instance configurations are saved locally in a JSON file (`data/instances.json`), keeping your data private.
- **Dark Mode**: Fully supports light and dark themes.

## Prerequisites

- **Node.js**: v18 or later.
- **n8n Instance**: You need a running n8n instance to handle the backend logic (communicating with AWS).

## Setup & Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/ob1lan/ligthweight-ec2-control
    cd ligthweight-ec2-control
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Copy the example environment file to create your local configuration:
    ```bash
    cp .env.example .env
    ```

    Open `.env` and configure your n8n Webhook URLs. The app **will not start** without these variables set.

    ```env
    # n8n Webhook URLs
    START_INSTANCE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    STOP_INSTANCE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    GET_STATUS_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    ```
4. **Create the file to declare your instances**:
Create the data/instances.json file, and declare the unique ID (whatever you want), instance ID (from AWS EC2) and name for each of your instances, such as:
     ```json
    [
      {
        "id": "oratio",
        "name": "Oratio",
        "ec2Id": "i-07392ec4d704bf351"
      },
      {
        "id": "wojefr7h3",
        "name": "Medusa",
        "ec2Id": "i-04c53e993726664e2"
      }
    ]
    ```


4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## n8n Integration

This frontend relies on an n8n workflow to communicate with AWS. The workflow should accept `POST` requests with a payload containing `name` and `instance_id`.

### Workflow Templates

Import the provided templates (see the workflows folder) into your n8n instance. Ensure your n8n instance has the correct AWS credentials configured to manage EC2 instances (start/stop/describe).

The workflow is expected to expose three webhooks corresponding to the environment variables defined above.

## Data Storage

Instance configurations (Name and ID) are stored locally in:
`data/instances.json`

This file is ignored by git to ensure your server details remain private.

## Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## License

[MIT](LICENSE)

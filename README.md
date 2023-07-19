# pg_webhooks #

### A simple webhook interface for PostgreSQL NOTIFY events ###

## Setup ##

The application is an express web app. Clone the repo and do 'npm install' (or use yarn if you prefer) to install the dependencies.

### Database ###

Use 'database/subscriptions.sql' to create the table that will store subscriptions. The application currently assumes the table will be in the public schema. The option to specify the schema will come later. The .sql file takes care of all of the necessary keys and constraints. The database enforces a unique constraint on the combination of channel and host in order to minimize the risk of the application being exploited for DDOS. This approach is not perfect.

The columns 'active' and 'failcount' are reserved for future use in failure management.

### Environment ###

The application include a sample .env file showing the environment variables used by the app. You can either put these in a .env file or create system-level environments. In production, it is recommended that the database password not be stored in a .env file.

## Usage ##

When running, the application accepts a POST to 'subscriptions/add' to register a new listener. The POST data will be a JSON document that looks like:

{"channel":"channel_name", "callback": "https://some.host.com/some/path"}

The app returns a unique ID for the subscription. In a future version, this ID will be appended to all webhook payloads so that listeners may validate that the payload originated from the app.

The app does not currently validate the callback URL. URLs that fail will die quietly. In a future version, a failure count threshold will be implemented to disable listeners that routinely fail.

## Webhook Payloads ##

The application will always wrap the output it receives from the NOTIFY event into a JSON object with a single property called 'payload'. If the output is a JSON formatted string, the application will parse it before wrapping to ensure a proper JSON object is returned. If the output is arbitrary text, it will be wrapped as-is.

Arbitrary text: Outsput 'some text' will be returned as {payload: "some text"}

JSON string: Output '{"output": "some text"}' will be returned as {payload: {output: "some text"}}

## Failure Management ##

If a webhook callback fails three consecutive times, or the value of the MAXFAILS environment variable, that callback will be disabled. It can only be re-enabled at the database level. This is by design. To do this, the administrator will reset the "failcount" field to 0 and the "active" field to true.



Thanks for your interest. Check backs for updates.
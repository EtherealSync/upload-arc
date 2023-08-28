import { Cron, Queue, StackContext } from "sst/constructs";

export function UploadMicroserice({ stack }: StackContext) {

  const poll = new Cron(stack, "Cron", {
    schedule: "rate(1 minute)",
    job: "packages/functions/src/lambda.handler"
  })

  const queue = new Queue(stack, "queue", {});

  poll.attachPermissions(['s3']);
  poll.bind([queue]);

  
}

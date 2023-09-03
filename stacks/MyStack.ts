import {Cron, Job, Queue, StackContext } from "sst/constructs";

export function UploadMicroserice({ stack }: StackContext) {

  const poll = new Cron(stack, "Cron", {
    schedule: "rate(1 minute)",
    job: "packages/functions/src/lambda.handler"
  })

  const queue = new Queue(stack, "queue", {});

  const upload = new Job(stack, "upload", {
    runtime: "container", 
    architecture: "arm_64",
    handler: "packages/UploadJob",
    logRetention: "one_week",
    timeout: "2 hours",
  })

  poll.attachPermissions(['s3']);
  poll.bind([queue, upload]);

  upload.attachPermissions(['s3','dynamodb']);
  
}

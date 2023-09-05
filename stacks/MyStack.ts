import { Cron, Job, Queue, StackContext } from "sst/constructs";

export function UploadMicroserice({ stack }: StackContext) {

  const queue = new Queue(stack, "queue", {});

  const upload = new Job(stack, "upload", {
    runtime: "container",
    architecture: "x86_64",
    handler: "packages/UploadJob",
    logRetention: "one_week",
    timeout: "2 hours",
  })

  const poll = new Cron(stack, "Cron", {
    schedule: "rate(1 minute)",
    job: {
      function: {
        handler: "packages/functions/src/lambda.handler",
        environment: {
          "UPLOAD_JOB_HANDLER_NAME": upload._jobManager.functionName
        },
        bind: [queue]
      } 
    } 
  })

  upload.attachPermissions(['s3','dynamodb']);
  upload._jobManager.grantInvoke(poll.jobFunction);

  poll.attachPermissions(['s3']);
  poll.bind([queue, upload]);
}

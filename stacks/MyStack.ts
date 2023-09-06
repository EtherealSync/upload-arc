import { Cron, Job, Queue, StackContext } from "sst/constructs";

export function UploadMicroserice({ stack }: StackContext) {

  const queue = new Queue(stack, "queue", {});

  const upload = new Job(stack, "upload", {
    runtime: "container",
    architecture: "arm_64",
    handler: "packages/UploadJob",
    logRetention: "one_week",
    timeout: "2 hours",
    container:{
      cmd: ["/upload"]
    },
    permissions: ['s3','dynamodb']
  })

  const poll = new Cron(stack, "Cron", {
    schedule: "rate(1 minute)",
    job: {
      function: {
        handler: "packages/functions/src/lambda.handler",
        bind: [queue, upload],
        permissions: ['s3']
      } 
    } 
  })
}

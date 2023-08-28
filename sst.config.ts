import { SSTConfig } from "sst";
import { UploadMicroserice } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "upload-arc",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(UploadMicroserice);
  }
} satisfies SSTConfig;

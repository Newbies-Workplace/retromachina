declare module "*.svg" {
  import React = require("react");
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}
declare module "*.svg?url" {
  const content: string;
  export default content;
}

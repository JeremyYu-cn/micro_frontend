import { PRODUCT_BY_MICRO_FRONTEND } from "../config/index";

/** 判断是否为微前端 */
export function isMicroFrountend() {
  return (<Record<string, any>>window)[PRODUCT_BY_MICRO_FRONTEND]
    ? true
    : false;
}

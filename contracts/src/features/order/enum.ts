/** Shop floor status. Delivered orders are locked unless force-edited. */
export enum EOrderStatus {
  NEW = "new",
  STITCHING = "stitching",
  STITCHED = "stitched",
  READY = "ready",
  DELIVERED = "delivered",
}

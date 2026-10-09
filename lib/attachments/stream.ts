// Only already verified bytes reach this stream; authorization stays in the handler.
export function attachmentStream(bytes: Uint8Array) {
 let offset=0;
 return new ReadableStream<Uint8Array>({
  pull(controller) {
   if(offset>=bytes.byteLength){controller.close();return;}
   const end=Math.min(offset+65536,bytes.byteLength);
   controller.enqueue(bytes.subarray(offset,end));offset=end;
  },
 });
}

// Type declarations for packages without official TypeScript support

declare module 'snarkjs' {
  export function groth16(options?: any): any;
  export const groth16: {
    prove: (circuitWasm: any, circuitZkey: any, input: any) => Promise<any>;
    verify: (vkey: any, publicSignals: any, proof: any) => Promise<boolean>;
    fullProve: (input: any, wasmFile: any, zkeyFile: any) => Promise<any>;
  };
}

declare module 'dotenv' {
  export function config(options?: any): any;
  export default { config };
}
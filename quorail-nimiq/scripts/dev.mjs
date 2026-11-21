import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),args=process.argv.slice(2);
const read=(key,fallback)=>{const i=args.indexOf(key);return i>=0&&args[i+1]?args[i+1]:fallback;};
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--hostname',read('--host','0.0.0.0'),'--port',read('--port',process.env.PORT||'3000')],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??0));

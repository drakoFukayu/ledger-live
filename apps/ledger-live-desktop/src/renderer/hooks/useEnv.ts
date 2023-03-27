import { useEffect, useState } from "react";
import { changes, getEnv } from "@ledgerhq/live-common/env";
import { EnvName, EnvValue } from "@ledgerhq/live-common/env";
const useEnv = <Name extends any>(type: Name): EnvValue<Name> => {
  const [env, setEnv] = useState(() => getEnv(type));
  useEffect(() => {
    const sub = changes.subscribe(({ name, value }) => {
      if (type === name) {
        setEnv(value);
      }
    });
    return () => sub.unsubscribe();
  }, [type]);
  return env;
};
export default useEnv;

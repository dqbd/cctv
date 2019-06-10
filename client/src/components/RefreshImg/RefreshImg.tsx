import React, { useEffect, useState, useRef } from 'react';
export const RefreshImg = ({ src, ...props }: {
  src: string | null;
  [rest: string]: any;
}) => {
  const [session, setSession] = useState(Date.now());
  const ref = useRef<number>();
  useEffect(() => {
    ref.current = window.setInterval(() => {
      setSession(Date.now());
    }, 15 * 1000);
    return () => {
      window.clearInterval(ref.current);
    };
  }, []);
  return <img src={`${src}?q=${session}`} {...props} />;
};

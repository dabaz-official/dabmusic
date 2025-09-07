import * as React from 'react';

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="24"
    fill="currentColor"
    viewBox="0 0 22 24"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M20.387 10.583c2.147 1.015 2.155 2.293 0 3.44l-16.653 9.53C1.642 24.5.221 23.94.072 21.89L0 1.946C-.046.058 1.787-.475 3.534.43z"
    ></path>
  </svg>
);

const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="24"
    fill="currentColor"
    viewBox="0 0 22 24"
    className={props.className}
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      d="M4.5 22V2m13.333 20V2"
    ></path>
  </svg>
);

const PrevSongIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="44"
    height="24"
    fill="currentColor"
    viewBox="0 0 44 24"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M44 22.053c.047 1.889-1.787 2.422-3.534 1.517L23.614 13.417c-2.148-1.016-2.155-2.293 0-3.44L40.266.446C42.358-.5 43.78.06 43.93 2.11zm-22 0c.047 1.889-1.787 2.422-3.534 1.517L1.614 13.417c-2.148-1.016-2.155-2.293 0-3.44L18.266.446C20.358-.5 21.78.06 21.928 2.11z"
    ></path>
  </svg>
);

const NextSongIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="44"
    height="24"
    fill="currentColor"
    viewBox="0 0 44 24"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M.001 1.947C-.046.058 1.788-.475 3.535.43l16.852 10.153c2.147 1.016 2.155 2.293 0 3.44l-16.652 9.53C1.643 24.5.22 23.94.072 21.89zm22 0C21.954.058 23.788-.475 25.535.43l16.852 10.153c2.147 1.016 2.155 2.293 0 3.44l-16.652 9.53c-2.093.947-3.513.388-3.662-1.662z"
    ></path>
  </svg>
);

const ExplicitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M4.312 24h15.377C22.51 24 24 22.507 24 19.72V4.28C24 1.494 22.51 0 19.689 0H4.312C1.5 0 0 1.49 0 4.28v15.44C0 22.51 1.5 24 4.312 24m4.836-6.109c-1.004 0-1.519-.605-1.519-1.637V7.558c0-1.027.52-1.635 1.52-1.635h5.874c.726 0 1.197.404 1.197 1.116 0 .686-.47 1.116-1.197 1.116h-4.608v2.67h4.377c.652 0 1.083.366 1.083 1.012 0 .636-.431.987-1.084.987h-4.376v2.834h4.608c.726 0 1.197.415 1.197 1.116 0 .699-.47 1.117-1.197 1.117z"
    ></path>
  </svg>
);

export { PlayIcon, PauseIcon, PrevSongIcon, NextSongIcon, ExplicitIcon };
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

export { PlayIcon, PauseIcon, PrevSongIcon, NextSongIcon };
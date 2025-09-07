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
      strokeWidth="6"
      d="M5 21V3m12 18V3"
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

const VolumeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M11.82.014c.289-.036.581-.006.856.087l.136.053.131.061c.3.156.553.388.737.67.209.323.32.698.32 1.08v20.063l-.005.144a2 2 0 0 1-.313.94c-.21.324-.511.58-.87.733a1.91 1.91 0 0 1-2.136-.434v-.001l-4.51-4.65-.002-.002a.9.9 0 0 0-.282-.196.8.8 0 0 0-.324-.066H2.333a2.31 2.31 0 0 1-1.66-.706A2.4 2.4 0 0 1 0 16.122V7.875c0-.62.239-1.221.673-1.668a2.31 2.31 0 0 1 1.66-.706h3.225q.167 0 .324-.067c.103-.044.2-.11.282-.195l.002-.003 4.513-4.65c.269-.277.616-.47.998-.547zm6.486 1.266a1 1 0 0 1 1.414.025 15.2 15.2 0 0 1 3.169 4.911A15.6 15.6 0 0 1 24 12c0 1.983-.378 3.948-1.111 5.783a15.2 15.2 0 0 1-3.17 4.91 1 1 0 0 1-1.439-1.388 13.2 13.2 0 0 0 2.752-4.264C21.671 15.444 22 13.73 22 12c0-1.73-.329-3.444-.968-5.041a13.2 13.2 0 0 0-2.752-4.265 1 1 0 0 1 .026-1.414M7.602 6.63 7.6 6.628a2.9 2.9 0 0 1-.934.644c-.352.15-.73.227-1.112.227H2.333a.31.31 0 0 0-.225.1.4.4 0 0 0-.108.275v8.247c0 .108.043.207.108.275a.31.31 0 0 0 .225.099h3.222c.382-.001.76.077 1.112.227s.67.37.935.645L12 21.903V2.095zm8.865-.476a1 1 0 0 1 1.379.312C18.86 8.078 19.4 10.02 19.4 12s-.54 3.921-1.554 5.533a1 1 0 0 1-1.692-1.067c.802-1.273 1.246-2.84 1.246-4.466s-.444-3.194-1.246-4.467a1 1 0 0 1 .313-1.38"
    ></path>
  </svg>
);

const MuteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M.293.293a1 1 0 0 1 1.414 0l22 22a1 1 0 0 1-1.414 1.414l-22-22a1 1 0 0 1 0-1.414M7 9.828v6.294c0 .108.043.207.108.275a.31.31 0 0 0 .225.099h3.222c.382-.001.76.077 1.112.227s.67.37.935.645L17 21.903v-2.075l2 2v.2l-.005.144a2 2 0 0 1-.313.94c-.21.324-.511.58-.87.733a1.915 1.915 0 0 1-2.136-.434l-4.51-4.65-.002-.003a.9.9 0 0 0-.282-.196.8.8 0 0 0-.324-.066H7.333a2.31 2.31 0 0 1-1.66-.706A2.4 2.4 0 0 1 5 16.122V7.875l.002-.045zM16.82.014c.289-.036.581-.006.856.087l.137.053.13.061c.3.156.553.388.737.67.209.323.32.698.32 1.08v14.207l-2-2V2.095L12.602 6.63l-.001-.001a2.818 2.818 0 0 1-2.046.871h-.226l-2-2h2.229a.8.8 0 0 0 .324-.066q.157-.067.282-.195l.002-.003L15.68.586c.269-.276.616-.47.998-.547z"
    ></path>
  </svg>
);

const ShuffleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <g clipPath="url(#clip0_2011_56)">
      <path
        fill="currentColor"
        d="M17.893 13.493a1 1 0 0 1 1.414 0l4.39 4.39q.039.038.075.08l.029.04.03.042.023.037q.015.022.028.047.01.019.018.039.033.068.056.14l.013.05A1 1 0 0 1 24 18.6q0 .12-.028.23l-.016.062-.01.032a1 1 0 0 1-.239.384l-4.4 4.4a1 1 0 0 1-1.414-1.414l2.692-2.694h-4.24a5.4 5.4 0 0 1-4.42-2.38l-.376-.47A1 1 0 0 1 13.11 15.5l.396.495.053.074a3.4 3.4 0 0 0 2.805 1.53h4.22l-2.692-2.693a1 1 0 0 1 0-1.414m0-13.2a1 1 0 0 1 1.414 0l4.39 4.39q.039.038.075.08l.019.027q.051.065.09.14.009.013.014.028a.99.99 0 0 1-.188 1.15l-4.4 4.399a1 1 0 0 1-1.414-1.414l2.692-2.694h-4.162a3.4 3.4 0 0 0-2.799 1.437l-5.98 9.428-.026.04a5.4 5.4 0 0 1-4.448 2.294L1 19.6a1 1 0 0 1 0-2h2.177a3.4 3.4 0 0 0 2.799-1.437l5.98-9.428.025-.04A5.4 5.4 0 0 1 16.43 4.4h4.155l-2.692-2.693a1 1 0 0 1 0-1.414M3.169 4.4A5.4 5.4 0 0 1 8.022 7.37a1.001 1.001 0 0 1-1.786.9 3.4 3.4 0 0 0-3.06-1.87H1a1 1 0 1 1 0-2z"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_2011_56">
        <path fill="#fff" d="M0 0h24v24H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

const RepeatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M21.9 12.1a1 1 0 0 1 1 1v1.1a5.4 5.4 0 0 1-5.4 5.4H4.514l2.693 2.693a1 1 0 0 1-1.414 1.414l-4.4-4.4a1 1 0 0 1-.125-.153 1 1 0 0 1-.163-.452q-.015-.15.013-.297a1 1 0 0 1 .135-.337l.015-.023q.054-.083.125-.152l4.4-4.4a1 1 0 0 1 1.414 1.414L4.514 17.6H17.5a3.4 3.4 0 0 0 3.4-3.4v-1.1a1 1 0 0 1 1-1M16.792.293a1 1 0 0 1 1.414 0l4.4 4.4a1 1 0 0 1 .15.194l.025.042a1 1 0 0 1 .085.221l.014.055a1 1 0 0 1-.274.903l-4.4 4.399a1 1 0 1 1-1.414-1.414L19.484 6.4H6.5a3.4 3.4 0 0 0-3.4 3.4v1.1a1 1 0 0 1-2 0V9.8a5.4 5.4 0 0 1 5.4-5.4h12.986l-2.693-2.693a1 1 0 0 1 0-1.414"
    ></path>
  </svg>
);

const Repeat1Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path
      fill="currentColor"
      d="M21.9 12.1a1 1 0 0 1 1 1v1.1a5.4 5.4 0 0 1-5.4 5.4H4.514l2.693 2.693a1 1 0 0 1-1.414 1.414l-4.4-4.4a1 1 0 0 1-.2-.288 1 1 0 0 1-.05-.127l-.015-.059a1 1 0 0 1 .002-.474l.013-.051a1 1 0 0 1 .26-.425l4.39-4.39a1 1 0 0 1 1.414 1.414L4.514 17.6H17.5a3.4 3.4 0 0 0 3.4-3.4v-1.1a1 1 0 0 1 1-1M12 8.8a1 1 0 0 1 1 1v4.4a1 1 0 0 1-2 0v-3.4h-.1a1 1 0 0 1 0-2zM16.792.293a1 1 0 0 1 1.414 0l4.4 4.4a1 1 0 0 1 .174.235l.014.03a.99.99 0 0 1-.187 1.15l-4.4 4.399a1 1 0 0 1-1.415-1.414L19.486 6.4H6.5a3.4 3.4 0 0 0-3.4 3.4v1.1a1 1 0 1 1-2 0V9.8a5.4 5.4 0 0 1 5.4-5.4h12.986l-2.693-2.693a1 1 0 0 1 0-1.414"
    ></path>
  </svg>
);

export { PlayIcon, PauseIcon, PrevSongIcon, NextSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon };
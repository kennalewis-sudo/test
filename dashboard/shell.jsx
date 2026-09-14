// Shell components: Logo, Sidebar, Topbar, Dropdown, icons
const { useState: useStateShell, useEffect: useEffectShell, useRef: useRefShell, useCallback: useCallbackShell, useMemo: useMemoShell } = React;

// ---------- Logo ----------
function TapInLogo({ size = 120 }) {
  return (
    <img src="assets/tapin-logo-dark.png" alt="TapIn" style={{ width: size, height: "auto", display: "block" }} />
  );
}

// ---------- Icons ----------
const Icon = {
  Dashboard: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M4.375 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5L0 4.375C0 5.03804 0.263392 5.67393 0.732233 6.14277C1.20107 6.61161 1.83696 6.875 2.5 6.875H4.375C5.03804 6.875 5.67393 6.61161 6.14277 6.14277C6.61161 5.67393 6.875 5.03804 6.875 4.375V2.5C6.875 1.83696 6.61161 1.20107 6.14277 0.732233C5.67393 0.263392 5.03804 0 4.375 0ZM5.625 4.375C5.625 4.70652 5.4933 5.02446 5.25888 5.25888C5.02446 5.4933 4.70652 5.625 4.375 5.625H2.5C2.16848 5.625 1.85054 5.4933 1.61612 5.25888C1.3817 5.02446 1.25 4.70652 1.25 4.375V2.5C1.25 2.16848 1.3817 1.85054 1.61612 1.61612C1.85054 1.3817 2.16848 1.25 2.5 1.25H4.375C4.70652 1.25 5.02446 1.3817 5.25888 1.61612C5.4933 1.85054 5.625 2.16848 5.625 2.5V4.375Z" fill="currentColor"/><path d="M12.5 0H10.625C9.96196 0 9.32607 0.263392 8.85723 0.732233C8.38839 1.20107 8.125 1.83696 8.125 2.5V4.375C8.125 5.03804 8.38839 5.67393 8.85723 6.14277C9.32607 6.61161 9.96196 6.875 10.625 6.875H12.5C13.163 6.875 13.7989 6.61161 14.2678 6.14277C14.7366 5.67393 15 5.03804 15 4.375V2.5C15 1.83696 14.7366 1.20107 14.2678 0.732233C13.7989 0.263392 13.163 0 12.5 0ZM13.75 4.375C13.75 4.70652 13.6183 5.02446 13.3839 5.25888C13.1495 5.4933 12.8315 5.625 12.5 5.625H10.625C10.2935 5.625 9.97554 5.4933 9.74112 5.25888C9.5067 5.02446 9.375 4.70652 9.375 4.375V2.5C9.375 2.16848 9.5067 1.85054 9.74112 1.61612C9.97554 1.3817 10.2935 1.25 10.625 1.25H12.5C12.8315 1.25 13.1495 1.3817 13.3839 1.61612C13.6183 1.85054 13.75 2.16848 13.75 2.5V4.375Z" fill="currentColor"/><path d="M4.375 8.125H2.5C1.83696 8.125 1.20107 8.38839 0.732233 8.85723C0.263392 9.32607 0 9.96196 0 10.625L0 12.5C0 13.163 0.263392 13.7989 0.732233 14.2678C1.20107 14.7366 1.83696 15 2.5 15H4.375C5.03804 15 5.67393 14.7366 6.14277 14.2678C6.61161 13.7989 6.875 13.163 6.875 12.5V10.625C6.875 9.96196 6.61161 9.32607 6.14277 8.85723C5.67393 8.38839 5.03804 8.125 4.375 8.125ZM5.625 12.5C5.625 12.8315 5.4933 13.1495 5.25888 13.3839C5.02446 13.6183 4.70652 13.75 4.375 13.75H2.5C2.16848 13.75 1.85054 13.6183 1.61612 13.3839C1.3817 13.1495 1.25 12.8315 1.25 12.5V10.625C1.25 10.2935 1.3817 9.97554 1.61612 9.74112C1.85054 9.5067 2.16848 9.375 2.5 9.375H4.375C4.70652 9.375 5.02446 9.5067 5.25888 9.74112C5.4933 9.97554 5.625 10.2935 5.625 10.625V12.5Z" fill="currentColor"/><path d="M12.5 8.125H10.625C9.96196 8.125 9.32607 8.38839 8.85723 8.85723C8.38839 9.32607 8.125 9.96196 8.125 10.625V12.5C8.125 13.163 8.38839 13.7989 8.85723 14.2678C9.32607 14.7366 9.96196 15 10.625 15H12.5C13.163 15 13.7989 14.7366 14.2678 14.2678C14.7366 13.7989 15 13.163 15 12.5V10.625C15 9.96196 14.7366 9.32607 14.2678 8.85723C13.7989 8.38839 13.163 8.125 12.5 8.125ZM13.75 12.5C13.75 12.8315 13.6183 13.1495 13.3839 13.3839C13.1495 13.6183 12.8315 13.75 12.5 13.75H10.625C10.2935 13.75 9.97554 13.6183 9.74112 13.3839C9.5067 13.1495 9.375 12.8315 9.375 12.5V10.625C9.375 10.2935 9.5067 9.97554 9.74112 9.74112C9.97554 9.5067 10.2935 9.375 10.625 9.375H12.5C12.8315 9.375 13.1495 9.5067 13.3839 9.74112C13.6183 9.97554 13.75 10.2935 13.75 10.625V12.5Z" fill="currentColor"/></svg>,
  Experiences: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M12.7913 1.22929L9.2375 0.138036C7.60375 -0.360089 5.85875 0.553036 5.34688 2.16304L5.22937 2.49991H3.12438C1.40188 2.49991 0 3.90179 0 5.62491V11.8749C0 13.598 1.40188 14.9999 3.125 14.9999H6.875C7.8725 14.9999 8.7525 14.5212 9.325 13.7912C9.46937 13.8112 9.61312 13.8237 9.755 13.8237C11.1094 13.8237 12.345 12.9399 12.7394 11.5962L14.8725 5.09803C15.3519 3.46491 14.4181 1.72929 12.7906 1.22991L12.7913 1.22929ZM6.875 13.7499H3.125C2.09125 13.7499 1.25 12.9087 1.25 11.8749V5.62491C1.25 4.59116 2.09125 3.74991 3.125 3.74991H6.875C7.90875 3.74991 8.75 4.59116 8.75 5.62491V11.8749C8.75 12.9087 7.90875 13.7499 6.875 13.7499ZM13.6794 4.72616L11.5469 11.2243C11.3231 11.983 10.6637 12.488 9.92 12.5568C9.96937 12.3362 10 12.1093 10 11.8743V5.62491C10 3.90179 8.59813 2.49991 6.875 2.49991H6.55813C6.89187 1.56179 7.91 1.03679 8.87062 1.33304L12.4244 2.42429C13.4006 2.72366 13.9612 3.76554 13.6794 4.72679V4.72616Z" fill="currentColor"/></svg>,
  TapPoints: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M7.5 15C3.36437 15 0 11.6356 0 7.5C0 3.36437 3.36437 0 7.5 0C11.6356 0 15 3.36437 15 7.5C15 11.6356 11.6356 15 7.5 15ZM7.5 1.25C4.05375 1.25 1.25 4.05375 1.25 7.5C1.25 10.9462 4.05375 13.75 7.5 13.75C10.9462 13.75 13.75 10.9462 13.75 7.5C13.75 4.05375 10.9462 1.25 7.5 1.25ZM7.5 12.5C4.74312 12.5 2.5 10.2569 2.5 7.5C2.5 4.74312 4.74312 2.5 7.5 2.5C10.2569 2.5 12.5 4.74312 12.5 7.5C12.5 10.2569 10.2569 12.5 7.5 12.5ZM7.5 3.75C5.43188 3.75 3.75 5.43188 3.75 7.5C3.75 9.56812 5.43188 11.25 7.5 11.25C9.56812 11.25 11.25 9.56812 11.25 7.5C11.25 5.43188 9.56812 3.75 7.5 3.75ZM7.5 10C6.12125 10 5 8.87875 5 7.5C5 6.12125 6.12125 5 7.5 5C8.87875 5 10 6.12125 10 7.5C10 8.87875 8.87875 10 7.5 10ZM7.5 6.25C6.81063 6.25 6.25 6.81063 6.25 7.5C6.25 8.18937 6.81063 8.75 7.5 8.75C8.18937 8.75 8.75 8.18937 8.75 7.5C8.75 6.81063 8.18937 6.25 7.5 6.25Z" fill="currentColor"/></svg>,
  Spaces: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M14.0532 6.85933L7.50006 10.7918L0.946936 6.85933C0.804796 6.77405 0.6346 6.74872 0.473787 6.78893C0.312975 6.82913 0.174719 6.93157 0.0894358 7.07371C0.00415207 7.21585 -0.0211739 7.38604 0.0190292 7.54686C0.0592323 7.70767 0.161671 7.84592 0.303811 7.93121L7.17881 12.0562C7.27602 12.1146 7.38728 12.1455 7.50069 12.1455C7.61409 12.1455 7.72535 12.1146 7.82256 12.0562L14.6976 7.93121C14.8397 7.84592 14.9421 7.70767 14.9823 7.54686C15.0225 7.38604 14.9972 7.21585 14.9119 7.07371C14.8267 6.93157 14.6884 6.82913 14.5276 6.78893C14.3668 6.74872 14.1966 6.77405 14.0544 6.85933H14.0532Z" fill="currentColor"/><path d="M14.0532 9.71444L7.50006 13.6463L0.946934 9.71444C0.876554 9.67221 0.798545 9.64426 0.717362 9.63217C0.636179 9.62009 0.553412 9.62412 0.473785 9.64403C0.394159 9.66394 0.319234 9.69933 0.253286 9.74819C0.187339 9.79706 0.131662 9.85843 0.0894339 9.92881C0.0472057 9.99919 0.0192534 10.0772 0.00717305 10.1584C-0.00490733 10.2396 -0.000879241 10.3223 0.0190273 10.402C0.0592304 10.5628 0.161669 10.701 0.303809 10.7863L7.17881 14.9113C7.27602 14.9697 7.38728 15.0006 7.50068 15.0006C7.61409 15.0006 7.72535 14.9697 7.82256 14.9113L14.6976 10.7863C14.8397 10.701 14.9421 10.5628 14.9823 10.402C15.0225 10.2411 14.9972 10.071 14.9119 9.92881C14.8267 9.78667 14.6884 9.68423 14.5276 9.64403C14.3668 9.60383 14.1966 9.62915 14.0544 9.71444H14.0532Z" fill="currentColor"/><path d="M7.50005 9.23316C7.16291 9.23298 6.83216 9.14116 6.54317 8.96754L0.303171 5.22316C0.210764 5.1676 0.134303 5.08907 0.0812219 4.99521C0.0281406 4.90136 0.000244141 4.79536 0.000244141 4.68754C0.000244141 4.57971 0.0281406 4.47372 0.0812219 4.37986C0.134303 4.286 0.210764 4.20748 0.303171 4.15191L6.54317 0.407535C6.83215 0.233928 7.16292 0.142212 7.50005 0.142212C7.83717 0.142212 8.16794 0.233928 8.45692 0.407535L14.6969 4.15191C14.7893 4.20748 14.8658 4.286 14.9189 4.37986C14.972 4.47372 14.9998 4.57971 14.9998 4.68754C14.9998 4.79536 14.972 4.90136 14.9189 4.99521C14.8658 5.08907 14.7893 5.1676 14.6969 5.22316L8.45692 8.96754C8.16793 9.14116 7.83718 9.23298 7.50005 9.23316ZM1.84005 4.68754L7.18755 7.89566C7.28199 7.95216 7.38999 7.98199 7.50005 7.98199C7.6101 7.98199 7.7181 7.95216 7.81255 7.89566L13.16 4.68754L7.81255 1.47941C7.7181 1.42291 7.6101 1.39308 7.50005 1.39308C7.38999 1.39308 7.28199 1.42291 7.18755 1.47941L1.84005 4.68754Z" fill="currentColor"/></svg>,
  Reports: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M7.5 0C6.46875 0 5.625 0.84375 5.625 1.875V13.125C5.625 14.1562 6.46875 15 7.5 15C8.53125 15 9.375 14.1562 9.375 13.125V1.875C9.375 0.84375 8.53125 0 7.5 0ZM8.125 13.125C8.125 13.4688 7.84375 13.75 7.5 13.75C7.15625 13.75 6.875 13.4688 6.875 13.125V1.875C6.875 1.53125 7.15625 1.25 7.5 1.25C7.84375 1.25 8.125 1.53125 8.125 1.875V13.125ZM13.125 3.75C12.0938 3.75 11.25 4.59375 11.25 5.625V13.125C11.25 14.1562 12.0938 15 13.125 15C14.1562 15 15 14.1562 15 13.125V5.625C15 4.59375 14.1562 3.75 13.125 3.75ZM13.75 13.125C13.75 13.4688 13.4688 13.75 13.125 13.75C12.7812 13.75 12.5 13.4688 12.5 13.125V5.625C12.5 5.28125 12.7812 5 13.125 5C13.4688 5 13.75 5.28125 13.75 5.625V13.125ZM1.875 7.5C0.84375 7.5 0 8.34375 0 9.375V13.125C0 14.1562 0.84375 15 1.875 15C2.90625 15 3.75 14.1562 3.75 13.125V9.375C3.75 8.34375 2.90625 7.5 1.875 7.5ZM2.5 13.125C2.5 13.4688 2.21875 13.75 1.875 13.75C1.53125 13.75 1.25 13.4688 1.25 13.125V9.375C1.25 9.03125 1.53125 8.75 1.875 8.75C2.21875 8.75 2.5 9.03125 2.5 9.375V13.125Z" fill="currentColor"/></svg>,
  User: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M7.5 7.5C8.24168 7.5 8.9667 7.28007 9.58339 6.86801C10.2001 6.45596 10.6807 5.87029 10.9645 5.18506C11.2484 4.49984 11.3226 3.74584 11.1779 3.01841C11.0333 2.29098 10.6761 1.6228 10.1517 1.09835C9.6272 0.573904 8.95902 0.216751 8.23159 0.0720569C7.50416 -0.0726377 6.75016 0.00162482 6.06494 0.285453C5.37971 0.569282 4.79404 1.04993 4.38199 1.66661C3.96993 2.2833 3.75 3.00832 3.75 3.75C3.75099 4.74426 4.1464 5.69751 4.84945 6.40056C5.55249 7.1036 6.50574 7.49901 7.5 7.5ZM7.5 1.25C7.99445 1.25 8.4778 1.39662 8.88893 1.67133C9.30005 1.94603 9.62048 2.33648 9.8097 2.79329C9.99892 3.25011 10.0484 3.75277 9.95196 4.23773C9.8555 4.72268 9.6174 5.16814 9.26777 5.51777C8.91814 5.8674 8.47268 6.1055 7.98773 6.20197C7.50277 6.29843 7.00011 6.24892 6.54329 6.0597C6.08648 5.87048 5.69603 5.55005 5.42133 5.13893C5.14662 4.7278 5 4.24445 5 3.75C5 3.08696 5.26339 2.45108 5.73223 1.98223C6.20107 1.51339 6.83696 1.25 7.5 1.25Z" fill="currentColor"/><path d="M7.5 8.75C6.00867 8.75165 4.57889 9.34482 3.52435 10.3994C2.46982 11.4539 1.87665 12.8837 1.875 14.375C1.875 14.5408 1.94085 14.6997 2.05806 14.8169C2.17527 14.9342 2.33424 15 2.5 15C2.66576 15 2.82473 14.9342 2.94194 14.8169C3.05915 14.6997 3.125 14.5408 3.125 14.375C3.125 13.2147 3.58594 12.1019 4.40641 11.2814C5.22688 10.4609 6.33968 10 7.5 10C8.66032 10 9.77312 10.4609 10.5936 11.2814C11.4141 12.1019 11.875 13.2147 11.875 14.375C11.875 14.5408 11.9408 14.6997 12.0581 14.8169C12.1753 14.9342 12.3342 15 12.5 15C12.6658 15 12.8247 14.9342 12.9419 14.8169C13.0592 14.6997 13.125 14.5408 13.125 14.375C13.1233 12.8837 12.5302 11.4539 11.4756 10.3994C10.4211 9.34482 8.99133 8.75165 7.5 8.75Z" fill="currentColor"/></svg>,
  Help: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M7.5 0C6.01664 0 4.5666 0.439867 3.33323 1.26398C2.09986 2.08809 1.13856 3.25943 0.570907 4.62987C0.00324965 6.00032 -0.145275 7.50832 0.144114 8.96318C0.433503 10.418 1.14781 11.7544 2.1967 12.8033C3.2456 13.8522 4.58197 14.5665 6.03683 14.8559C7.49168 15.1453 8.99968 14.9968 10.3701 14.4291C11.7406 13.8614 12.9119 12.9001 13.736 11.6668C14.5601 10.4334 15 8.98336 15 7.5C14.9979 5.51154 14.207 3.60513 12.8009 2.19907C11.3949 0.793018 9.48847 0.00215068 7.5 0ZM7.5 13.75C6.26387 13.75 5.0555 13.3834 4.02769 12.6967C2.99988 12.0099 2.1988 11.0338 1.72576 9.89177C1.25271 8.74973 1.12894 7.49307 1.3701 6.28069C1.61125 5.06831 2.20651 3.95466 3.08059 3.08058C3.95466 2.2065 5.06831 1.61125 6.28069 1.37009C7.49307 1.12893 8.74974 1.25271 9.89178 1.72575C11.0338 2.1988 12.0099 2.99988 12.6967 4.02769C13.3834 5.05549 13.75 6.26387 13.75 7.5C13.7482 9.15705 13.0891 10.7457 11.9174 11.9174C10.7457 13.0891 9.15705 13.7482 7.5 13.75Z" fill="currentColor"/><path d="M7.5 6.25H6.875C6.70924 6.25 6.55027 6.31585 6.43306 6.43306C6.31585 6.55027 6.25 6.70924 6.25 6.875C6.25 7.04076 6.31585 7.19973 6.43306 7.31694C6.55027 7.43415 6.70924 7.5 6.875 7.5H7.5V11.25C7.5 11.4158 7.56585 11.5747 7.68306 11.6919C7.80027 11.8092 7.95924 11.875 8.125 11.875C8.29076 11.875 8.44973 11.8092 8.56694 11.6919C8.68415 11.5747 8.75 11.4158 8.75 11.25V7.5C8.75 7.16848 8.6183 6.85054 8.38388 6.61612C8.14946 6.3817 7.83152 6.25 7.5 6.25Z" fill="currentColor"/><path d="M7.5 5C8.01777 5 8.4375 4.58027 8.4375 4.0625C8.4375 3.54473 8.01777 3.125 7.5 3.125C6.98223 3.125 6.5625 3.54473 6.5625 4.0625C6.5625 4.58027 6.98223 5 7.5 5Z" fill="currentColor"/></svg>,
  Logout: (p) => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}><path d="M7.1725 9.375C7.00674 9.375 6.84777 9.44085 6.73056 9.55806C6.61335 9.67527 6.5475 9.83424 6.5475 10V11.875C6.5475 12.3723 6.34996 12.8492 5.99833 13.2008C5.64669 13.5525 5.16978 13.75 4.6725 13.75H3.125C2.62772 13.75 2.15081 13.5525 1.79917 13.2008C1.44754 12.8492 1.25 12.3723 1.25 11.875V3.125C1.25 2.62772 1.44754 2.15081 1.79917 1.79917C2.15081 1.44754 2.62772 1.25 3.125 1.25H4.6725C5.16978 1.25 5.64669 1.44754 5.99833 1.79917C6.34996 2.15081 6.5475 2.62772 6.5475 3.125V5C6.5475 5.16576 6.61335 5.32473 6.73056 5.44194C6.84777 5.55915 7.00674 5.625 7.1725 5.625C7.33826 5.625 7.49723 5.55915 7.61444 5.44194C7.73165 5.32473 7.7975 5.16576 7.7975 5V3.125C7.79651 2.2965 7.46695 1.50222 6.88111 0.916387C6.29528 0.330551 5.501 0.000992411 4.6725 0H3.125C2.2965 0.000992411 1.50222 0.330551 0.916387 0.916387C0.330551 1.50222 0.000992411 2.2965 0 3.125L0 11.875C0.000992411 12.7035 0.330551 13.4978 0.916387 14.0836C1.50222 14.6694 2.2965 14.999 3.125 15H4.6725C5.501 14.999 6.29528 14.6694 6.88111 14.0836C7.46695 13.4978 7.79651 12.7035 7.7975 11.875V10C7.7975 9.83424 7.73165 9.67527 7.61444 9.55806C7.49723 9.44085 7.33826 9.375 7.1725 9.375Z" fill="currentColor"/><path d="M14.2919 6.17449L11.4256 3.30824C11.368 3.24854 11.299 3.20093 11.2228 3.16817C11.1465 3.13542 11.0645 3.11818 10.9815 3.11746C10.8985 3.11673 10.8162 3.13255 10.7394 3.16397C10.6626 3.1954 10.5928 3.24181 10.5341 3.30049C10.4754 3.35917 10.429 3.42896 10.3976 3.50577C10.3662 3.58258 10.3504 3.66488 10.3511 3.74786C10.3518 3.83085 10.3691 3.91286 10.4018 3.98911C10.4346 4.06537 10.4822 4.13433 10.5419 4.19199L13.2056 6.85636L3.75 6.87511C3.58424 6.87511 3.42527 6.94096 3.30806 7.05817C3.19085 7.17538 3.125 7.33435 3.125 7.50011C3.125 7.66587 3.19085 7.82484 3.30806 7.94205C3.42527 8.05926 3.58424 8.12511 3.75 8.12511L13.2425 8.10574L10.5406 10.8082C10.4809 10.8659 10.4333 10.9349 10.4006 11.0111C10.3678 11.0874 10.3506 11.1694 10.3498 11.2524C10.3491 11.3353 10.3649 11.4176 10.3964 11.4945C10.4278 11.5713 10.4742 11.6411 10.5329 11.6997C10.5916 11.7584 10.6613 11.8048 10.7382 11.8363C10.815 11.8677 10.8973 11.8835 10.9803 11.8828C11.0632 11.882 11.1453 11.8648 11.2215 11.832C11.2978 11.7993 11.3667 11.7517 11.4244 11.692L14.2906 8.82574C14.6423 8.47429 14.84 7.99755 14.8402 7.50037C14.8405 7.00319 14.6432 6.52627 14.2919 6.17449Z" fill="currentColor"/></svg>,
  Search: (p) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.5"/><path d="m10.6 10.6 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Caret: (p) => <svg width="10" height="6" viewBox="0 0 10 6" fill="none" {...p}><path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: (p) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><rect x="1.5" y="2.5" width="11" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 5.5h11M4 1.2v2.4M10 1.2v2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Bell: (p) => <svg width="18" height="24" viewBox="0 0 18 24" fill="none" {...p}><path d="M8.84615 23.0769C7.62544 23.0707 6.63563 22.043 6.62356 20.7692H11.0466C11.049 21.0777 10.9926 21.3836 10.8808 21.6692C10.5907 22.3638 9.99816 22.8705 9.28846 23.0308H9.28293H9.26635H9.24644H9.23649C9.10802 23.0587 8.97735 23.0741 8.84615 23.0769ZM17.6923 19.6154H0V17.3077L2.21154 16.1538V9.80769C2.15328 8.17975 2.5056 6.56438 3.23327 5.12308C3.95759 3.78636 5.19567 2.83717 6.63462 2.51538V0H11.0577V2.51538C13.9095 3.22385 15.4808 5.81308 15.4808 9.80769V16.1538L17.6923 17.3077V19.6154Z" fill="currentColor"/></svg>,
  Plus: (p) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  TapHand: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m22,19.279v3.721c0,.552-.447,1-1,1s-1-.448-1-1v-3.721c0-1.425-1.015-2.662-2.412-2.942l-6.784-1.357c-.467-.093-.804-.504-.804-.98v-6.893c0-.538-.362-1.018-.824-1.092-.306-.05-.596.03-.823.223-.224.19-.353.468-.353.762v13.638c0,.384-.22.734-.566.901-.344.167-.756.122-1.057-.119l-2.637-2.1c-.463-.428-1.095-.406-1.47-.004-.376.403-.355,1.039.047,1.417l1.377,1.328c.397.383.409,1.016.025,1.414-.383.397-1.016.408-1.414.025l-1.367-1.318c-1.195-1.121-1.259-3.023-.13-4.231,1.129-1.206,3.029-1.271,4.237-.144l.955.759V7c0-.881.385-1.714,1.057-2.286.671-.572,1.561-.818,2.439-.674,1.427.231,2.503,1.55,2.503,3.066v6.073l5.98,1.196c2.329.466,4.02,2.528,4.02,4.903ZM3.544,10.5c.14,0,.281-.029.417-.091.502-.23.722-.824.492-1.326-.301-.655-.453-1.356-.453-2.083,0-2.757,2.243-5,5-5s5,2.243,5,5c0,.729-.152,1.429-.452,2.083-.231.502-.011,1.096.49,1.326.505.231,1.097.011,1.326-.491.422-.917.636-1.899.636-2.917,0-3.86-3.14-7-7-7S2,3.14,2,7c0,1.017.214,1.998.635,2.917.168.367.531.583.91.583Z"/></svg>,
  Users: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m7.5 13a4.5 4.5 0 1 1 4.5-4.5 4.505 4.505 0 0 1 -4.5 4.5zm0-7a2.5 2.5 0 1 0 2.5 2.5 2.5 2.5 0 0 0 -2.5-2.5zm7.5 17v-.5a7.5 7.5 0 0 0 -15 0v.5a1 1 0 0 0 2 0v-.5a5.5 5.5 0 0 1 11 0v.5a1 1 0 0 0 2 0zm9-5a7 7 0 0 0 -11.667-5.217 1 1 0 1 0 1.334 1.49 5 5 0 0 1 8.333 3.727 1 1 0 0 0 2 0zm-6.5-9a4.5 4.5 0 1 1 4.5-4.5 4.505 4.505 0 0 1 -4.5 4.5zm0-7a2.5 2.5 0 1 0 2.5 2.5 2.5 2.5 0 0 0 -2.5-2.5z"/></svg>,
  Doc: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12,7c-2.757,0-5,2.243-5,5s2.243,5,5,5,5-2.243,5-5-2.243-5-5-5Zm0,8c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm11-4h-1.05c-.471-4.717-4.233-8.48-8.95-8.95V1c0-.553-.448-1-1-1s-1,.447-1,1v1.05C6.283,2.52,2.52,6.283,2.05,11H1c-.552,0-1,.447-1,1s.448,1,1,1h1.05c.471,4.717,4.233,8.48,8.95,8.95v1.05c0,.553,.448,1,1,1s1-.447,1-1v-1.05c4.717-.471,8.48-4.233,8.95-8.95h1.05c.552,0,1-.447,1-1s-.448-1-1-1Zm-11,9c-4.411,0-8-3.589-8-8S7.589,4,12,4s8,3.589,8,8-3.589,8-8,8Z"/></svg>,
  Trend: (p) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M3 13.5 7 9l3 2.5 6.5-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4.5h4.5V9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Expand: (p) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit: (p) => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" {...p}><path d="m9 1.5 2.5 2.5L4.5 11l-3 .5.5-3L9 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Upload: (p) => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" {...p}><path d="M6.5 9V2.5M3.5 5.5 6.5 2.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v.5A1.5 1.5 0 0 0 3.5 12h6A1.5 1.5 0 0 0 11 10.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Copy: (p) => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" {...p}><rect x="3.5" y="3.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 9V2.7a1.2 1.2 0 0 1 1.2-1.2H9" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Trash: (p) => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" {...p}><path d="M2 3.5h9M5 1.5h3M3.5 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  UserMinus: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m8,12c3.309,0,6-2.691,6-6S11.309,0,8,0,2,2.691,2,6s2.691,6,6,6Zm0-10c2.206,0,4,1.794,4,4s-1.794,4-4,4-4-1.794-4-4,1.794-4,4-4Zm8,20v1c0,.552-.447,1-1,1s-1-.448-1-1v-1c0-3.309-2.691-6-6-6s-6,2.691-6,6v1c0,.552-.447,1-1,1s-1-.448-1-1v-1c0-4.411,3.589-8,8-8s8,3.589,8,8Zm8-10c0,.552-.447,1-1,1h-7c-.553,0-1-.448-1-1s.447-1,1-1h7c.553,0,1,.448,1,1Z"/></svg>,
};

// ---------- Sidebar ----------
function Sidebar({ route, onNav }) {
  const menu = [
    { key: "dashboard", label: "Dashboard", icon: Icon.Dashboard },
    { key: "experiences", label: "Experiences", icon: Icon.Experiences },
    { key: "tappoints", label: "TapPoints", icon: Icon.TapPoints },
    { key: "spaces", label: "Spaces", icon: Icon.Spaces },
    { key: "people", label: "Users", icon: Icon.Users },
    { key: "reports", label: "Reports", icon: Icon.Reports },
  ];
  const others = [
    { key: "account", label: "Account", icon: Icon.User },
    { key: "helpdesk", label: "Support", icon: Icon.Help },
    { key: "logout", label: "Logout", icon: Icon.Logout },
  ];
  return (
    <aside className="sidebar">
      <TapInLogo />
      <div className="nav-section">
        <ul className="nav-list">
          {menu.map((m) => {
            const Ico = m.icon;
            const active = route === m.key || (route === "space-edit" && m.key === "spaces");
            return (
              <li key={m.key}>
                <button
                  className={"nav-item" + (active ? " is-active" : "")}
                  onClick={() => onNav(m.key)}
                >
                  <span className="nav-icon"><Ico /></span>
                  <span className="nav-label-text">{m.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="nav-section nav-others">
        <ul className="nav-list">
          {others.map((m) => {
            const Ico = m.icon;
            return (
              <li key={m.key}>
                <button
                  className="nav-item"
                  onClick={() => onNav(m.key === "logout" ? "logout" : m.key)}
                >
                  <span className="nav-icon"><Ico /></span>
                  <span className="nav-label-text">{m.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

// ---------- Dropdown ----------
function Dropdown({ trigger, children, align = "left", width }) {
  const [open, setOpen] = useStateShell(false);
  const ref = useRefShell(null);

  useEffectShell(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const close = useCallbackShell(() => setOpen(false), []);

  return (
    <div className={"dropdown" + (open ? " is-open" : "")} ref={ref}>
      <button className="dropdown-trigger" onClick={() => setOpen((v) => !v)} type="button" style={width ? { minWidth: width } : null}>
        {trigger}
        <span className="caret"><Icon.Caret /></span>
      </button>
      {open && (
        <div className={"dropdown-menu" + (align === "right" ? " right" : "")} style={width ? { minWidth: width } : null}>
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

// ---------- Topbar ----------
function Topbar({ title, subtitle, onNotif, onUserMenu }) {
  const [notifOpen, setNotifOpen] = useStateShell(false);
  const [hasUnread, setHasUnread] = useStateShell(true);
  const notifRef = useRefShell(null);
  useEffectShell(() => {
    if (!notifOpen) return;
    const onDoc = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen]);
  const notifications = [
    { id: 1, kind: "blue", title: "New tap on Dinosaur Discoveries", desc: "Visitor scanned TapPoint 1 in NHM.", time: "2m ago", unread: true },
    { id: 2, kind: "green", title: "Taps increased 11% since last week", desc: "NHM is trending up across all experiences.", time: "1h ago", unread: true },
    { id: 3, kind: "purple", title: "New lead captured", desc: "Mary Anning experience received a lead form submission.", time: "3h ago", unread: true },
    { id: 4, kind: "orange", title: "TapPoint 4 offline", desc: "Rhomaleosaurus has not reported in 24h.", time: "Yesterday", unread: false },
    { id: 5, kind: "blue", title: "New tap on Mary Anning", desc: "Visitor scanned TapPoint 2 in NHM.", time: "Yesterday", unread: false },
    { id: 6, kind: "green", title: "Weekly report ready", desc: "Your NHM weekly summary is available to download.", time: "2d ago", unread: false },
    { id: 7, kind: "purple", title: "Joe Bloggs invited a new admin", desc: "Sarah Khan has joined Natural History Museum, London.", time: "3d ago", unread: false },
    { id: 8, kind: "orange", title: "Experience archived", desc: "Ocean Reefs was archived by Jane Smith.", time: "4d ago", unread: false },
    { id: 9, kind: "blue", title: "New tap on Life Written on Wings", desc: "Visitor scanned TapPoint 3 in Norwich.", time: "5d ago", unread: false },
    { id: 10, kind: "green", title: "Taps increased 23% in Aquarium of Sea", desc: "Aquarium spaces are growing fast.", time: "1w ago", unread: false },
  ];
  return (
    <div className="topbar">
      <div className="page-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-right">
        <div className="notif-dropdown" ref={notifRef} style={{ position: "relative" }}>
          <button
            className={"bell" + (hasUnread ? "" : " is-clear")}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            type="button"
          >
            <Icon.Bell />
          </button>
          {notifOpen && (
            <div className="dropdown-menu right" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0 }}>
              <div className="notif-header">
                <span>Notifications</span>
                <span className="notif-badge">{notifications.filter(n => n.unread).length} new</span>
              </div>
              <div className="notif-scroll">
              {notifications.map(n => (
                <div key={n.id} className="notif-item" onClick={() => { setHasUnread(false); }}>
                  <span className={"notif-item__icon notif-item__icon--" + n.kind}>
                    {n.kind === "blue" ? <Icon.TapHand /> : n.kind === "green" ? <Icon.Trend /> : n.kind === "purple" ? <Icon.Users /> : <Icon.Bell />}
                  </span>
                  <div className="notif-item__body">
                    <div className="notif-item__title">
                      {n.unread && <span className="notif-dot" />}
                      {n.title}
                    </div>
                    <div className="notif-item__desc">{n.desc}</div>
                    <div className="notif-item__time">{n.time}</div>
                  </div>
                </div>
              ))}
              </div>
              <div className="notif-footer" onClick={() => { setNotifOpen(false); setHasUnread(false); }}>Mark all as read</div>
            </div>
          )}
        </div>
        <Dropdown
          align="right"
          width={220}
          trigger={
            <div className="user-pill" style={{ padding: 0, background: "transparent" }}>
              <span className="avatar">JB</span>
              <span className="user-meta">
                <span className="user-name">Joe Bloggs</span>
                <span className="user-role">{window.__viewerRole === "Space Admin" ? "Space admin" : "Organization admin"}</span>
              </span>
            </div>
          }
        >
          {({ close }) => (
            <>
              <div className="item" onClick={() => { close(); window.__tapinNav && window.__tapinNav("account"); }}>Account settings</div>
              <div className="item is-destructive" onClick={close}>Sign out</div>
            </>
          )}
        </Dropdown>
      </div>
    </div>
  );
}

// ---------- Space Switcher ----------
function SpaceSwitcher({ value, onChange }) {
  const spaces = window.DATA.SPACES;
  const current = spaces.find((s) => s.id === value);
  const label = value === "all" ? "All Spaces" : (current ? current.name : "All Spaces");
  return (
    <div className="space-switcher">
      <Dropdown
        width={220}
        trigger={<span>{label}</span>}
      >
        {({ close }) => (
          <>
            <div className={"item" + (value === "all" ? " is-selected" : "")} onClick={() => { onChange("all"); close(); }}>All Spaces</div>
            {spaces.map((s) => (
              <div key={s.id} className={"item" + (value === s.id ? " is-selected" : "")} onClick={() => { onChange(s.id); close(); }}>
                {s.name}
              </div>
            ))}
          </>
        )}
      </Dropdown>
    </div>
  );
}

// ---------- Period chip group ----------
function PeriodControl({ value, onChange, simple }) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useStateShell({ kind: "28" });
  const period = controlled ? value : internal;
  const setPeriod = (p) => { if (onChange) onChange(p); if (!controlled) setInternal(p); };
  const [pickerOpen, setPickerOpen] = useStateShell(false);
  const initialRange = window.periodRange(period);
  const [customStart, setCustomStart] = useStateShell(initialRange.startISO);
  const [customEnd, setCustomEnd] = useStateShell(initialRange.endISO);
  const [calMonth, setCalMonth] = useStateShell(() => {
    const d = new Date(initialRange.endISO + "T00:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const panelRef = useRefShell(null);

  const opts = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "thisWeek", label: "This week" },
    { id: "lastWeek", label: "Last week" },
    { id: "7", label: "Last 7 days" },
    { id: "28", label: "Last 28 days" },
    { id: "90", label: "Last 90 days" },
    { id: "thisMonth", label: "This month" },
    { id: "lastMonth", label: "Last month" },
    { id: "thisYear", label: "This year" },
    { id: "lastYear", label: "Last year" },
    { id: "all", label: "All time" },
    { id: "custom", label: "Custom range" },
  ];

  useEffectShell(() => {
    if (!pickerOpen) return;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  useEffectShell(() => {
    const r = window.periodRange(period);
    setCustomStart(r.startISO);
    setCustomEnd(r.endISO);
    const d = new Date(r.endISO + "T00:00:00");
    setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [period.kind, period.startISO, period.endISO]);

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    setPeriod({ kind: "custom", startISO: customStart, endISO: customEnd });
    setPickerOpen(false);
  };

  const range = window.periodRange(period);
  const rangeText = window.formatRange(range.startISO, range.endISO);
  const currentLabel = window.periodLabel(period);

  const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  };
  const fmtUS = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") + "/" + d.getFullYear();
  };

  const calDays = (() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const startDow = first.getDay();
    const monthEnd = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
    const cells = [];
    for (let i = 0; i < startDow; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() - (startDow - i));
      cells.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      cells.push({ date: new Date(calMonth.getFullYear(), calMonth.getMonth(), i), inMonth: true });
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(last.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return cells;
  })();

  const startD = customStart ? new Date(customStart + "T00:00:00") : null;
  const endD = customEnd ? new Date(customEnd + "T00:00:00") : null;
  const isSame = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const inRange = (d) => startD && endD && d >= startD && d <= endD;

  const handleDayClick = (d) => {
    if (!startD || (startD && endD)) {
      setCustomStart(toIso(d));
      setCustomEnd("");
    } else if (d < startD) {
      setCustomStart(toIso(d));
      setCustomEnd("");
    } else {
      setCustomEnd(toIso(d));
    }
  };

  const stepMonth = (delta) => {
    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1));
  };

  return (
    <div className="period-controls" ref={panelRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="period-trigger"
        onClick={() => setPickerOpen((v) => !v)}
        aria-expanded={pickerOpen}
      >
        <Icon.Calendar />
        <span className="period-trigger__label">{currentLabel}</span>
        <Icon.Caret />
      </button>
      <span className="period-range">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>{rangeText}</span>
      </span>
      {pickerOpen && simple && (
        <div className="date-picker date-picker--simple">
          <ul className="date-picker__presets">
            {opts.filter(o => o.id !== "custom").map((o) => (
              <li
                key={o.id}
                className={"date-picker__preset" + (period.kind === o.id ? " is-active" : "")}
                onClick={() => { setPeriod({ kind: o.id }); setPickerOpen(false); }}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {pickerOpen && !simple && (
        <div className="date-picker">
          <div className="date-picker__fields">
            <div className="date-picker__field">
              <Icon.Calendar />
              <input
                type="text"
                value={fmtUS(customStart)}
                readOnly
                placeholder="MM/DD/YYYY"
              />
            </div>
            <span className="date-picker__sep">to</span>
            <div className="date-picker__field is-focused">
              <Icon.Calendar />
              <input
                type="text"
                value={fmtUS(customEnd)}
                readOnly
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>
          <div className="date-picker__body">
            <ul className="date-picker__presets">
              {opts.map((o) => (
                <li
                  key={o.id}
                  className={"date-picker__preset" + (period.kind === o.id ? " is-active" : "")}
                  onClick={() => {
                    if (o.id === "custom") return;
                    setPeriod({ kind: o.id });
                    setPickerOpen(false);
                  }}
                >
                  {o.label}
                </li>
              ))}
            </ul>
            <div className="date-picker__cal">
              <div className="date-picker__cal-head">
                <button type="button" className="date-picker__nav" onClick={() => stepMonth(-1)} aria-label="Previous month">‹</button>
                <span className="date-picker__cal-title">{calMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
                <button type="button" className="date-picker__nav" onClick={() => stepMonth(1)} aria-label="Next month">›</button>
              </div>
              <div className="date-picker__cal-grid">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <span key={d} className="date-picker__cal-dow">{d}</span>)}
                {calDays.map((c, i) => {
                  const sel = isSame(c.date, startD) || isSame(c.date, endD);
                  const between = !sel && inRange(c.date);
                  const cls = [
                    "date-picker__cal-day",
                    !c.inMonth ? "is-outside" : "",
                    sel ? "is-selected" : "",
                    between ? "is-in-range" : "",
                    isSame(c.date, startD) ? "is-range-start" : "",
                    isSame(c.date, endD) ? "is-range-end" : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cls}
                      onClick={() => handleDayClick(c.date)}
                    >{c.date.getDate()}</button>
                  );
                })}
              </div>
              <div className="date-picker__cal-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setCustomStart(""); setCustomEnd(""); }}>Clear</button>
                <button type="button" className="btn btn--primary btn--sm" disabled={!customStart || !customEnd} onClick={applyCustom}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Avatar with letter fallback ----------
function SpaceAvatar({ space, size = 44 }) {
  const palette = {
    nhm: { bg: "#3F1D5E", fg: "#FFE875" },
    aqs: { bg: "#CFE9F0", fg: "#0D6B82" },
    swv: { bg: "#E4E4E4", fg: "#444" },
    cdm: { bg: "#FCE3C9", fg: "#C97200" },
    nwg: { bg: "#1A3C2A", fg: "#9FD188" },
  };
  const p = palette[space.id] || { bg: "#EFF8FF", fg: "#007DF9" };
  return (
    <div
      className="row-avatar"
      style={{
        width: size,
        height: size,
        background: p.bg,
        color: p.fg,
        fontSize: size > 40 ? 14 : 12,
      }}
      aria-label={space.name}
    >
      {space.short || space.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FrequencyControl({ value = "daily", onChange }) {
  const opts = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
    { id: "yearly", label: "Yearly" },
  ];
  const current = opts.find((o) => o.id === value) || opts[0];
  return (
    <div className="freq-dropdown freq-dropdown--inline">
    <span className="freq-dropdown__label">Frequency:</span>
    <Dropdown
      align="right"
      trigger={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span>{current.label}</span>
        </span>
      }
    >
      {opts.map((o) => (
        <div
          key={o.id}
          className={"item" + (o.id === value ? " is-selected" : "")}
          onClick={() => onChange && onChange(o.id)}
        >
          {o.label}
        </div>
      ))}
    </Dropdown>
    </div>
  );
}

// ---------- Multi-select filter chip ----------
function MultiSelect({ label, options, values, onChange, allLabel, placeholder = "Search…" }) {
  const [open, setOpen] = useStateShell(false);
  const [search, setSearch] = useStateShell("");
  const ref = useRefShell(null);
  useEffectShell(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const filtered = options.filter((o) => !search || o.label.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id) => {
    const next = values.includes(id) ? values.filter((x) => x !== id) : [...values, id];
    onChange(next);
  };
  const triggerLabel = values.length === 0
    ? (allLabel || label)
    : values.length === 1
      ? (options.find(o => o.id === values[0]) || {}).label || label
      : label + ": " + values.length;
  return (
    <div className="multi-select" ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={"multi-trigger" + (values.length ? " is-on" : "")}
        onClick={() => setOpen((v) => !v)}
      >
        {values.length > 0 && <span className="multi-trigger__count">{values.length}</span>}
        <span>{triggerLabel}</span>
        <Icon.Caret />
        {values.length > 0 && (
          <span
            className="multi-trigger__clear"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            aria-label="Clear"
          >×</span>
        )}
      </button>
      {open && (
        <div className="multi-pop">
          <div className="multi-pop__search">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
            />
            <Icon.Search />
          </div>
          <ul className="multi-pop__list">
            {filtered.length === 0 && (
              <li className="multi-pop__item" style={{ color: "var(--ink-500)" }}>No matches</li>
            )}
            {filtered.map((o) => {
              const on = values.includes(o.id);
              return (
                <li
                  key={o.id}
                  className={"multi-pop__item" + (on ? " is-on" : "")}
                  onClick={() => toggle(o.id)}
                >
                  <span className="multi-pop__check">{on ? "✓" : ""}</span>
                  <span style={{ flex: 1 }}>{o.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- ExportButton ----------
// Icon-only download button with a hover tooltip and click-to-open menu.
// Default options: Download CSV + Download PNG. Pass `options` to override.
function ExportButton({ options, tooltip = "Download", align = "right" }) {
  const [open, setOpen] = useStateShell(false);
  const ref = useRefShell(null);

  useEffectShell(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const opts = (options && options.length) ? options : [
    { label: "Download CSV", onClick: () => {} },
    { label: "Download PNG", onClick: () => {} },
  ];

  return (
    <div
      className={"export-btn-wrap" + (open ? " is-open" : "")}
      ref={ref}
    >
      <button
        type="button"
        className="export-btn"
        aria-label={tooltip}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2V11M8 11L4.5 7.5M8 11L11.5 7.5M2.5 13.5H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={"export-menu" + (align === "right" ? " right" : "")} role="menu">
          {opts.map((o, i) => (
            <button
              key={i}
              role="menuitem"
              className="export-menu-item"
              onClick={() => { setOpen(false); if (o.onClick) o.onClick(); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FrequencyControl, Icon, Sidebar, Topbar, Dropdown, ExportButton, SpaceSwitcher, PeriodControl, SpaceAvatar, TapInLogo, MultiSelect });

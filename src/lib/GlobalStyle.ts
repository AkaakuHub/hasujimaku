import "@fontsource/klee-one/400.css";
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
body {
  font-family: 'Klee One', sans-serif;
  font-weight: 400;
}
p, h1, h2, h3, h4, h5, h6, li, td, a, span {
  transform: rotate(0.028deg);
}
`
export default GlobalStyle;
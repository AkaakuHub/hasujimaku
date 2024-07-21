import { Button } from "@mui/material";
import styled from '@emotion/styled';

interface CustomButtonProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
}

const CustomButton = styled(Button) <CustomButtonProps>`
  color: #1976d2;
  font-family: 'Klee One', sans-serif;
  text-transform: none;
  ${({ href }) => href && `
    text-decoration: none;
  `}
  margin-bottom: 6px;
`;

const CustomLink: React.FC<CustomButtonProps> = ({ children, href, target }) => {
  return (
    <CustomButton href={href} target={target ? target : "_self"}>
      <span style={{ margin: 0 }}>
        {children}
      </span>
    </CustomButton>
  );
};

export default CustomLink;
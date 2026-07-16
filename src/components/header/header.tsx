import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";

type Props = {
  themeColor: string;
  changeThemeColor: () => void;
};

const Header: React.FC<Props> = ({ themeColor, changeThemeColor }) => {
  return (
    <Box component="header">
      <AppBar position="static" sx={{ bgcolor: themeColor, color: "common.black" }}>
        <Toolbar>
          <Button
            color="inherit"
            onClick={changeThemeColor}
            sx={{ justifyContent: "center", flexGrow: 1, fontSize: "1.25rem", fontWeight: 400 }}
          >
            活動記録字幕ジェネレーター
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;

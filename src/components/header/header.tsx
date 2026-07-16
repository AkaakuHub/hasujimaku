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
      <AppBar
        position="static"
        sx={{
          bgcolor: themeColor,
          color: "common.black",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            m: 0,
            p: 0,
            alignItems: "stretch",
          }}
        >
          <Box
            component="h1"
            sx={{
              m: 0,
              p: 0,
              width: "100%",
              display: "flex",
              lineHeight: 0,
            }}
          >
            <Button
              color="inherit"
              onClick={changeThemeColor}
              title="テーマカラーを変更"
              sx={{
                width: "100%",
                m: 0,
                borderRadius: 0,
                justifyContent: "center",
                fontSize: "1.25rem",
                fontWeight: 400,
              }}
            >
              蓮ノ空 活動記録字幕ジェネレーター
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  themeName: string;
};

const Footer = ({ themeName }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  return (
    <Box
      component="footer"
      sx={{ bgcolor: "common.black", color: "common.white", px: 2, py: 1, textAlign: "center" }}
    >
      <Typography variant="caption" component="div">
        ※本サイトはファンメイドであり、公式とは一切関係ありません。
        <br />
        現在{themeName}のテーマカラーで表示しています。
        <br />
        ヘッダーをクリックしてみてね！
      </Typography>
      <Button color="inherit" size="small" onClick={handleOpen}>
        プライバシーポリシー
      </Button>
      <Typography variant="caption" component="div">
        <Link href="https://twitter.com/akaakuhub" target="_blank" rel="noreferrer" color="inherit">
          Akaaku
        </Link>
        &apos;s product
      </Typography>
      <Dialog open={isModalOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          プライバシーポリシー
          <IconButton
            aria-label="閉じる"
            onClick={handleClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            本サイトでは、ユーザー体験の向上やサイトの最適化のため、Googleアナリティクスを使用しています。
            <br />
            Googleアナリティクスでは、Cookieを使用して、個人を特定できない形で匿名データを収集しています。
            <br />
            もしデータ収集を拒否したい場合は、お使いのブラウザの設定を変更してください。
            <br />
            <br />
            詳しくは、
            <Link
              href="https://marketingplatform.google.com/about/analytics/terms/jp/"
              target="_blank"
              rel="noreferrer"
            >
              Googleアナリティクス利用規約
            </Link>
            や
            <Link
              href="https://policies.google.com/technologies/ads?hl=ja"
              target="_blank"
              rel="noreferrer"
            >
              Googleのポリシーと規約
            </Link>
            をご確認ください。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Footer;

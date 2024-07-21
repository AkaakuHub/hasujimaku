import React from "react";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import GlobalStyle from "@/lib/GlobalStyle";

import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';

import CustomLink from "@/components/customButton/CustomButton";

type Props = {
  themeName: string;
};

const Footer: React.FC<Props> = ({
  themeName
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "70%",
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      <GlobalStyle />
      <AppBar component="footer" position="static" sx={{ backgroundColor: '#000000' }}
        style={{
          height: 'auto',
          textAlign: 'center',
          alignItems: 'center',
          padding: '0.5em',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption"
              sx={{
                flexGrow: 1,
                fontFamily: '"Klee One"!important',
                fontWeight: '400!important',
              }}
            >
              <p>
                ※本サイトはファンメイドであり、公式とは一切関係ありません。
                <br />
                現在{themeName}のテーマカラーで表示しています。
                <br />
                ヘッダーをクリックしてみてね！
                <br />
                <br />
                <span onClick={handleOpen}>
                  <CustomLink>
                    プライバシーポリシー
                  </CustomLink>
                </span>
                <br />
                <CustomLink href="https://twitter.com/akaakuhub" target="_blank">
                  Akaaku
                </CustomLink>
                &apos;s product
              </p>
            </Typography>
          </Box>
        </Container>
      </AppBar>
      <Modal
        open={isModalOpen}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              プライバシーポリシー
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            本サイトでは、ユーザー体験の向上やサイトの最適化のため、Googleアナリティクスを使用しています。
            <br />
            Googleアナリティクスでは、Cookieを使用して、個人を特定できない形で匿名データを収集しています。
            <br />
            もしデータ収集を拒否したい場合は、お使いのブラウザの設定を変更してください。
            <br />
            <br />
            詳しくは、
            <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank">Googleアナリティクス利用規約</a>
            や
            <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank">Googleのポリシーと規約</a>
            をご確認ください。
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default Footer;
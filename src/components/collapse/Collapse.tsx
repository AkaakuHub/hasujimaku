// import GlobalStyle from "@/lib/GlobalStyle";

// import React from "react";
// // material-ui
// import {
//   Card,
//   CardHeader,
//   CardContent,
//   Divider,
//   Typography,
//   Button,
//   Collapse,
//   Input,
// } from "@mui/material";
// import {
//   ExpandMore as ExpandMoreIcon,
//   ExpandLess as ExpandLessIcon,
// } from "@mui/icons-material";
// // styles

// import styles from "./style.module.scss";

// import { offsetType } from '@/types';

// type Props = {
//   offsetData: offsetType;
//   setOffsetData: (offsetData: offsetType) => void;
// }

// const TextCard: React.FC<Props> = ({
//   offsetData,
//   setOffsetData,
// }) => {

//   const [expanded, setExpanded] = React.useState(false);
//   const handleExpandClick = () => {
//     setExpanded(!expanded);
//   };

//   return (
//     <div>
//       <GlobalStyle />
//       <Card>
//         <CardHeader
//           title={<Typography variant="h6"
//             style={{
//               fontFamily: '"M PLUS Rounded 1c"!important',
//             }}
//           >詳細設定</Typography>}
//         />
//         <Divider />
//         <CardContent>
//           <Collapse in={expanded} timeout="auto" unmountOnExit>
//             <div>
//               所属テキストの相対位置を調整できます。
//             </div>
//             <div className={styles["select-container"]}
//             >
//               <span>サイズ:</span>
//               <Input
//                 type="number"
//                 placeholder="サイズを入力"
//                 value={offsetData.size}
//                 onChange={(e) => {
//                   const newOffsetData = { ...offsetData, "size": Number(e.target.value) };
//                   setOffsetData(newOffsetData);
//                 }}
//               />
//             </div>
//             <br />
//             <div className={styles["select-container"]}
//             >
//               <span>横位置:</span>
//               <Input
//                 type="number"
//                 placeholder="横位置を入力"
//                 value={offsetData.x}
//                 onChange={(e) => {
//                   const newOffsetData = { ...offsetData, "x": Number(e.target.value) };
//                   setOffsetData(newOffsetData);
//                 }}
//               />
//             </div>
//             <br />
//             <div className={styles["select-container"]}
//             >
//               <span>縦位置:</span>
//               <Input
//                 type="number"
//                 placeholder="縦位置を入力"
//                 value={offsetData.y}
//                 onChange={(e) => {
//                   const newOffsetData = { ...offsetData, "y": Number(e.target.value) };
//                   setOffsetData(newOffsetData);
//                 }}
//               />
//             </div>
//             <br />
//             <div className={styles["select-container"]}
//             >
//               <span>文字間隔:</span>
//               <Input
//                 type="number"
//                 placeholder="文字間隔を入力"
//                 value={offsetData.spacing}
//                 onChange={(e) => {
//                   const newOffsetData = { ...offsetData, "spacing": Number(e.target.value) };
//                   setOffsetData(newOffsetData);
//                 }}
//               />
//             </div>
//             <br />
//           </Collapse>
//         </CardContent>
//         <div>
//           <Button
//             fullWidth
//             onClick={handleExpandClick}
//             startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
//           >
//             {expanded ? "閉じる" : "開く"}
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default TextCard;
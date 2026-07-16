export type Theme = {
  name: string;
  colors: readonly [background: string, accent: string];
};

export const themes: readonly Theme[] = [
  { name: "花帆", colors: ["#FCE8B2", "#F8B500"] },
  { name: "さやか", colors: ["#CBD9ED", "#5383C3"] },
  { name: "梢", colors: ["#D1EBDC", "#68BE8D"] },
  { name: "綴理", colors: ["#EABDC2", "#BA2636"] },
  { name: "瑠璃乃", colors: ["#F7CFE1", "#E7609E"] },
  { name: "慈", colors: ["#EEECED", "#C8C2C6"] },
  { name: "吟子", colors: ["#E3F3F4", "#A2D7DD"] },
  { name: "小鈴", colors: ["#FDF3D0", "#FAD764"] },
  { name: "姫芽", colors: ["#E1DCF6", "#9D8DE2"] },
  { name: "セラス", colors: ["#FAD7D3", "#F56455"] },
  { name: "泉", colors: ["#C7F1EB", "#1EBECD"] },
];

import { List, ListItem, Typography } from "@mui/material";

const ItemList = ({ items }: { items: string[] }) => (
  <List
    component="ul"
    disablePadding
    sx={{
      pl: 3,
      textAlign: "left",
      listStyleType: "disc",
    }}
  >
    {items.map((item, index) => (
      <ListItem
        key={index}
        component="li"
        disableGutters
        sx={{
          display: "list-item",
          py: 0.25,
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
          {item}
        </Typography>
      </ListItem>
    ))}
  </List>
);

export default ItemList;

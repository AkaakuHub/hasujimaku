import { memo, useRef, useState, type FC } from "react";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { getUnsupportedKleeOneCharacters } from "../../lib/kleeOneUnsupportedCharacters";

export interface ImageDetails {
  name: string;
  quote: string;
}

interface ImageDetailsFormProps {
  baseImageBase64: string;
  confirmedDetails: ImageDetails | null;
  isFetching: boolean;
  renderingError: string | null;
  onConfirm: (details: ImageDetails) => void;
  onCurrentChange: (isCurrent: boolean) => void;
}

const isCurrentDetails = (details: ImageDetails, confirmedDetails: ImageDetails | null): boolean =>
  confirmedDetails !== null &&
  details.name === confirmedDetails.name &&
  details.quote === confirmedDetails.quote;

const ImageDetailsForm: FC<ImageDetailsFormProps> = ({
  baseImageBase64,
  confirmedDetails,
  isFetching,
  renderingError,
  onConfirm,
  onCurrentChange,
}) => {
  const [details, setDetails] = useState<ImageDetails>({ name: "", quote: "" });
  const [isComposing, setIsComposing] = useState(false);
  const [unsupportedCharacters, setUnsupportedCharacters] = useState<string[]>([]);
  const isCurrentRef = useRef(false);
  const hasUnsupportedCharacters = unsupportedCharacters.length > 0;
  const canConfirm = !isComposing && baseImageBase64 !== "" && !isFetching;

  const updateDetails = (nextDetails: ImageDetails) => {
    setDetails(nextDetails);
    setUnsupportedCharacters([]);
    const nextIsCurrent = isCurrentDetails(nextDetails, confirmedDetails);
    if (isCurrentRef.current !== nextIsCurrent) {
      isCurrentRef.current = nextIsCurrent;
      onCurrentChange(nextIsCurrent);
    }
  };

  const confirm = () => {
    const nextUnsupportedCharacters = getUnsupportedKleeOneCharacters(details.quote, details.name);
    setUnsupportedCharacters(nextUnsupportedCharacters);
    if (nextUnsupportedCharacters.length > 0) {
      return;
    }

    onConfirm(details);
    if (!isCurrentRef.current) {
      isCurrentRef.current = true;
      onCurrentChange(true);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h2" sx={{ textAlign: "center" }}>
        2.情報を入力
      </Typography>
      <TextField
        label="セリフ"
        multiline
        minRows={2}
        placeholder="セリフを入力"
        error={hasUnsupportedCharacters}
        value={details.quote}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onBlur={() => setIsComposing(false)}
        onChange={(event) => updateDetails({ ...details, quote: event.target.value })}
      />
      <TextField
        label="名前"
        placeholder="名前を入力"
        error={hasUnsupportedCharacters}
        value={details.name}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onBlur={() => setIsComposing(false)}
        onChange={(event) => updateDetails({ ...details, name: event.target.value })}
      />
      <Typography variant="body2" sx={{ textAlign: "center" }}>
        行を増やす場合は改行してください。
      </Typography>
      {hasUnsupportedCharacters && (
        <Typography color="error" variant="body2">
          Klee Oneに対応していない文字があります:
          <Box component="span" sx={{ fontFamily: "system-ui" }}>
            「{unsupportedCharacters.join("、")}」
          </Box>
        </Typography>
      )}
      {baseImageBase64 === "" && (
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          まず、画像を選択してください。
        </Typography>
      )}
      {renderingError !== null && (
        <Typography color="error" variant="body2">
          {renderingError}
        </Typography>
      )}
      <Button variant="contained" disabled={!canConfirm} sx={{ height: 48 }} onClick={confirm}>
        {isFetching ? <CircularProgress size={28} /> : "画像を確定"}
      </Button>
    </Stack>
  );
};

export default memo(ImageDetailsForm);

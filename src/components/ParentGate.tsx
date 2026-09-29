import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';

type ParentGateProps = {
  open: boolean;
  onPass: () => void;
  onCancel: () => void;
};

// Multiplying two numbers from 3 to 9 is easy for grown-ups and out of reach for young children.
const newQuestion = () => ({ a: 3 + Math.floor(Math.random() * 7), b: 3 + Math.floor(Math.random() * 7) });

/** Keeps editing and deleting behind a question young children can't answer. */
export function ParentGate({ open, onPass, onCancel }: ParentGateProps) {
  const [question, setQuestion] = useState(newQuestion);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Number(answer) === question.a * question.b) {
      onPass();
      return;
    }
    setWrong(true);
    setAnswer('');
    setQuestion(newQuestion());
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Grown-ups only</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">To add and change cards, sets and children, answer this:</Typography>
          <Typography variant="h4" component="p" textAlign="center" sx={{ my: 2 }}>
            What is {question.a} × {question.b}?
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))}
            error={wrong}
            helperText={wrong ? "That's not it. Here's a new one." : ' '}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!answer}>
            Continue
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

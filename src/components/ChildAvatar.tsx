import { Avatar, SxProps, Theme } from '@mui/material';
import { avatarColor } from '../flashcards/practice';
import { ChildProfile } from '../flashcards/types';

type ChildAvatarProps = {
  profile: Pick<ChildProfile, 'avatar' | 'avatarImage'>;
  size: number;
  className?: string;
  sx?: SxProps<Theme>;
};

/** A child's photo avatar, or their emoji on its color. */
export function ChildAvatar({ profile, size, className, sx }: ChildAvatarProps) {
  return (
    <Avatar
      className={className}
      src={profile.avatarImage || undefined}
      alt=""
      sx={[
        { width: size, height: size, fontSize: Math.round(size * 0.58), bgcolor: avatarColor(profile.avatar) },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {profile.avatar}
    </Avatar>
  );
}

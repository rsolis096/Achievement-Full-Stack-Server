//This Component describes the actual individual items of the achievement list
//This component handles only one individual achievement item per instance
import { TotalAchievement } from "../interfaces/types";
import {Grid, Paper, Typography, Box} from "@mui/material";
import "../styles/AchievementItem.css";


interface AchievementItemProps {
  data: TotalAchievement;
}

function AchievementItem(props: AchievementItemProps) {
  return (
    <>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }} key={props.data.apiname}>
        {/* Entire Card */}
        <Grid container spacing={2} className="ach-card">
            {/* Image Section */}
            <Grid item xs={12} sm={2} >
              <img className="ach-image"
                  src={props.data.achieved === 1 ? props.data.achievementinfo?.icon : props.data.achievementinfo?.icongray}
                  alt={props.data.achievementinfo?.displayName}
              />
            </Grid>

            {/* Body Section */}
            <Grid item xs={12} sm={6} className="ach-body">
              <Typography variant="h6">{props.data.achievementinfo?.displayName}</Typography>
              <Typography variant="body1">{props.data.achievementinfo?.description}</Typography>
            </Grid>

            {/* Unlock Info Section */}
            <Grid item xs={12} sm={4} className="unlock-info">
              <Box>
                <Typography variant="body2">Unlocked: {props.data.achieved === 1 ? "True" : "False"}</Typography>
                <Typography variant="body2">Percentage: {props.data.globaldata?.percent}</Typography>
              </Box>
              {/*Debug info to ensure accurately combined*/}
              <Box mt={2}>
                <Typography variant="body2">Game: {props.data.achievementinfo?.name}</Typography>
                <Typography variant="body2">User: {props.data.apiname}</Typography>
                <Typography variant="body2">Global: {props.data.globaldata?.name}</Typography>
              </Box>
            </Grid>
        </Grid>
      </Paper>
    </>
  );
}

export default AchievementItem;

import React, { useEffect, useState } from "react";

import axios, {AxiosResponse} from "axios";

import {
  AppBar,
  Tabs,
  Tab,
  Grid,
  Paper,
  Button,
  Typography,
  List,
  Box,
  ListItemButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox, IconButton,

} from "@mui/material";

import SortIcon from '@mui/icons-material/Sort';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import AchievementList from "./AchievementList.tsx";

import "../styles/App.css";
import {Game, TotalAchievement} from "../interfaces/types.tsx";
import GameItem from "./GameItem.tsx";

function App() {

  //Define state variables
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortFilter, setSortFilter] = useState<number>(0)
  const [currentSort, setCurrentSort] = useState<string>("Most to Least Rare")
  const [visibleFilter, setVisibleFilter] = useState<boolean[]>([false, false]);
  const [userLibraryState, setUserLibraryState] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game>();
  const [gamesCount, setGamesCount] = useState<number>(10)

  //Fetch the game data from the server (API or Database determined by server)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: AxiosResponse<Game[]> = await axios.post(
            "http://localhost:3000/api/games/getGames",
            {
              count: gamesCount,
              headers: {
                "Content-Type": "application/json",
              }
            }
        );
        setUserLibraryState(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [gamesCount]);

  //Used to determine if filter menu is open
  const open = Boolean(anchorEl);

  /*Button Handlers*/

  const handleExpandButton = () => {
    console.log(gamesCount)
    setGamesCount( (prevState) => {
      return prevState + 5
    })
    console.log(userLibraryState.length)
  }

  const handleCheckBox = (index : number) => {
    setVisibleFilter(prevState => prevState.map((item, idx) => idx === index ? !item : item))
  }

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (n : number) => {
    //Close filter when a filter choice is selected and do stuff
    const labels = ["Most to Least Rare", "Least To Most Rare"];
    setAnchorEl(null)
    if(n != -1){
      setSortFilter(n)
      setCurrentSort(labels[n])
    }
  };

  //What happens when an item on the game list is clicked
  const handleGameClick = (game  : Game) => {
    //Load up the achievements for the game
    setSelectedGame(game);
  };

  /* Helper Functions */

  //Display the selectable games for the left column
  const gameItems = userLibraryState.map((item) => (
      <ListItemButton key={item.appid} onClick={() => handleGameClick(item)}>
        <GameItem key={item.appid} game={item} />
      </ListItemButton>
  ));

  return (
    <>
      {/* Main Tabs Navigation */}
      <AppBar position="static">
        <Tabs value = {0} onChange = {() => {"button pressed"}}>
          <Tab label="Steam"/>
          <Tab label="PlayStation" />
        </Tabs>
      </AppBar>

      {/* Main Body Content */}
      <Grid container spacing={0.5} style={{ marginTop: '20px' }}>

        {/*Games Bar*/}
        <Grid item xs={12} sm={4} md={3} >
          <Paper elevation = {3} className="game-list-container">
            <Typography style = {{color : "white"}} variant="h5">Games</Typography>
            <List>{gameItems}</List>
            <IconButton
                className = "expand-game-list-button"
                style = {{color: "white"}}
                size = "large"
                onClick = {handleExpandButton}
            >
              <AddCircleOutlineIcon />
            </IconButton>
          </Paper>
        </Grid>

        {/*Achievements Bar*/}
        <Grid item xs={12} sm={8} md={9} className="achievement-list-container" >

            {/*Achievement List Filter Bar*/}
            <AppBar className = "achievement-filters" position="static">
              <Box display="flex" alignItems="center">

                {/*Filter Button*/}
                <Button
                    id="basic-button"
                    onClick={handleFilterClick}
                    variant="contained"
                    startIcon = {<SortIcon />}
                >
                  {currentSort}
                </Button>

                {/*Sort Button Dropdown menu*/}
                <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => handleClose(-1)}
                >
                  <MenuItem onClick={() =>handleClose(0)}>Most to Least Rare</MenuItem>
                  <MenuItem onClick={() =>handleClose(1)}>Least to Most Rare</MenuItem>
                </Menu>

                {/*Hide Locked Checkbox*/}
                  <FormControlLabel
                      control={
                        <Checkbox
                            name="Show Locked"
                            onChange = {() => handleCheckBox(0)}
                            style = {{color: "white"}}
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                        />
                      }
                      label="Hide Locked"
                      style={{ marginLeft: '10px' }} // Adjust spacing as needed
                  />

                  <FormControlLabel
                      control={
                        <Checkbox
                            name="Show Locked"
                            onChange = {() => handleCheckBox(1)}
                            style = {{color: "white"}}
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                        />
                      }
                      label="Hide Unlocked"
                      style={{ marginLeft: '10px' }} // Adjust spacing as needed
                  />

              </Box>
            </AppBar>

            {/*Achievement List Display Box*/}
            <Box >
              {/*Achievement List Items*/}
              {selectedGame ? (
                  <AchievementList
                      key={selectedGame.appid}
                      name={selectedGame.name}
                      appid={selectedGame.appid}
                      items={selectedGame.achievements}
                      sort = {sortFilter}
                      visibleItems = {visibleFilter}
                  />
              ) : (
                  <Typography variant="body1">Select a game to see achievements.</Typography>
              )}
            </Box>

        </Grid>

      </Grid>

    </>
  );
}

export default App;

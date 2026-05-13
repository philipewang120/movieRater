import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";

function Navbar({ user }) {

  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  function toggleDrawer() {
    setMobileOpen((prev) => !prev);
  }

  async function handleLogout() {

    try {

      await axios.post(
        "http://localhost:3000/logout",
        {},
        {
          withCredentials: true
        }
      );

      navigate("/login");

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }
  }

  const navLinks = (
    <>
      <Button
        color="inherit"
        component={Link}
        to="/movies"
      >
        Movies
      </Button>

      <Button
        color="inherit"
        component={Link}
        to="/add"
        startIcon={<AddIcon />}
      >
        Add Movie
      </Button>

      <Button
        color="inherit"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </>
  );

  return (
    <>

      <AppBar
        position="sticky"
        elevation={2}
      >

        <Toolbar>

          <Typography
            variant="h5"
            component={Link}
            to="/movies"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold"
            }}
          >
            MovieRater
          </Typography>

          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex"
              },
              alignItems: "center",
              gap: 2
            }}
          >

            {navLinks}

            {user?.profile_pic && (
              <Avatar
                src={user.profile_pic}
                alt="Profile"
              />
            )}

          </Box>

          <IconButton
            color="inherit"
            edge="end"
            onClick={toggleDrawer}
            sx={{
              display: {
                xs: "flex",
                md: "none"
              }
            }}
          >
            <MenuIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={toggleDrawer}
      >

        <Box
          sx={{
            width: 250
          }}
          role="presentation"
          onClick={toggleDrawer}
        >

          <List>

            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/movies"
              >
                <ListItemText primary="Movies" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/add"
              >
                <ListItemText primary="Add Movie" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>

          </List>

        </Box>
      </Drawer>

    </>
  );
}

export default Navbar;
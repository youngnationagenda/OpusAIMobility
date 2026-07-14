<body>
    <div class="main-container">
        <div class="header-container">
            <div class="header-logo-container">
                <a href="dashboard.php?p=restaurants"> 
                   <img src="assets/img/logo.png" width="120px">
                </a>
            </div>
            <div class="header-search-bar-container">
                <!-- <div class="serach-bar-container">
                    <div class="search-feild-container">
                        <input type="text" id="search"placeholder="Search" autocapitalize="off" autocomplete="off" autocorrect="off" value="" onkeyup="mainSearch(this)">
                        <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm9.707 4.293-4.82-4.82A5.968 5.968 0 0 0 14 8 6 6 0 0 0 2 8a6 6 0 0 0 6 6 5.968 5.968 0 0 0 3.473-1.113l4.82 4.82a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414z"></path></svg>
                    </div>
                    <div class="mainSearch"></div> 
                    
                </div> -->
                <div class="user-dropdown">
                    <button class="user-dropdown-btn dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <svg viewBox="0 0 40 40"><text x="50%" y="50%" dy="0.35em" fill="currentColor" font-size="20" text-anchor="middle"><?php echo substr($_SESSION[PRE_FIX.'first_name'] ,0,1).substr($_SESSION[PRE_FIX.'last_name'] ,0,1)?></text></svg>
                        <span class="svg-name"><?php echo $_SESSION[PRE_FIX.'first_name'].' '.$_SESSION[PRE_FIX.'last_name'];?></span>
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        <div class="header-drop-border">
                            <a class="dropdown-item" href="dashboard.php?p=setting">
                                <i class="fa fa-cog " aria-hidden="true"></i>
                                Setting
                            </a>
                            <a class="dropdown-item" href="process.php?action=logout">
                                <i class="im im-arrow-right-circle"></i>
                                Log out
                            </a>
                        </div>
                        <a class="dropdown-item" href="#">
                            Help Center
                        </a>
                    </div>
                </div>
            </div>
        </div>
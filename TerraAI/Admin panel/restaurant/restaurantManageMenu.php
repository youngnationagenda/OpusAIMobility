<?php
    if (isset($_SESSION[PRE_FIX . 'id']))  
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showMainMenus';
        $data = array(
            "restaurant_id" => $id
        );
        $json_data = @curl_request($data, $url);
        
        ?>
            <div class="main-content-container">
                <div class="main-content-container-wrap manage-menu-wrapper">
                    <div class="content-page-header">
                        <div class="page-header-text">Manage Menu</div>
                        <div class="page-header-btn">
                            <button class="add-product-btn" onclick="addMenu(<?php echo $id;?>)">Add Menu</button>
                        </div>
                    </div>
                    <section class="page-content-card-container">
                        <div class="left-sec-card-container">
                            <div class="items-card-container">
                                <div class="items-card-header p-0">
                                    <div class="item-card-body-content pb-0">
                                        <h2 class="descriptionTitle"></h2>
                                    </div>
                                    <div class="item-card-body-container b--top item-card-manage-menu">
                                        <ul>
                                            <?php
                                                if(is_array($json_data['msg']) || is_object($json_data['msg']))  
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <li>
                                                                <div class="menu-wrapper">
                                                                    <div class="col-left-image">
                                                                        <img src="<?php echo checkImageExist($imagebaseurl.$singleRow['RestaurantMenu']['image']); ?>">
                                                                    </div>
                                                                    <div class="col-left-text">
                                                                        <h2><?php echo $singleRow['RestaurantMenu']['name'];?></h2>
                                                                        <p><?php echo $singleRow['RestaurantMenu']['description'];?></p>
                                                                    </div>
                                                                    <div class="col-right-icon">
                                                                        <i title="Edit User" class="fas fa-edit" onclick="editMenu(<?php echo $singleRow['RestaurantMenu']['id']?> , <?php echo $id;?>)"></i>&nbsp;&nbsp;
                                                                        <a onclick="return confirmAction()" href="process.php?action=deleteMenu&id=<?php echo $singleRow['RestaurantMenu']['id']?>&restaurant_id=<?php echo $id;?>"><i class="fas fa-trash-alt" style="color:#90908f;cursor: pointer;" ></i></a>&nbsp;&nbsp;
                                                                        <i class="fas fa-angle-down" data-id="<?php echo $singleRow['RestaurantMenu']['id']?>" onclick="openMenu(<?php echo $singleRow['RestaurantMenu']['id']?>)" data-count=""style="font-size: 19px;"></i>
                                                                    </div>
                                                                </div>
                                                                
                                                                <!-- Sub Menu  -->
                                                                <div class=" submenu-wrapper submenu-wrapper<?php echo $singleRow['RestaurantMenu']['id']?>">
                                                                    <?php
                                                                        foreach ($singleRow['RestaurantMenuItem'] as $row) 
                                                                        {
                                                                            ?>
                                                                                <div class="submenu">
                                                                                    <div class="col-left-image">
                                                                                        <img src="<?php echo checkImageExist($imagebaseurl.$row['image']); ?>">
                                                                                    </div>
                                                                                    <div class="col-left-text">
                                                                                        <h2><?php echo $row['name'];?></h2>
                                                                                        <p><?php echo $row['description'];?></p>
                                                                                    </div>
                                                                                    <div class="col-right-icon sub-menu-col-right">
                                                                                        <div>
                                                                                            <p>
                                                                                                <?php echo $row['price'];?>
                                                                                            </p>
                                                                                            <p style="margin: 10px 0px;">
                                                                                            <a  href="javascript:;" class="main_menu_item_edit" 
                                                                                                data-main-menu-id="<?php echo $singleRow['RestaurantMenu']['id']?>" 
                                                                                                data-menu-id="<?php echo $row['id']?>" data-menu-name="<?php echo $row['name'];?>" 
                                                                                                data-menu-description="<?php echo $row['description'];?>" data-menu-price="<?php echo $row['price'];?>"
                                                                                                data-out-of-stock="<?php echo $row['out_of_order'];?>" data-restaurant-id="<?php echo $id;?>"
                                                                                                data-image="<?php echo $row['image']?>"
                                                                                            >
                                                                                                <i title="Edit User" class="fas fa-edit" style="font-size:14px;color:#90908f;cursor: pointer;" ></i>
                                                                                            </a>&nbsp;&nbsp;
                                                                                                <a onclick="return confirmAction()" href="process.php?action=deleteMenuItem&id=<?php echo $row['id']?>&restaurant_id=<?php echo $id;?>"><i class="fas fa-trash-alt" style="font-size:14px;color:#90908f;cursor: pointer;"></i></a>
                                                                                            </p>
                                                                                            <?php
                                                                                                if($row['out_of_order'] == 0)
                                                                                                {
                                                                                                    echo '<p style="color:#008060;">Available</p>';
                                                                                                }
                                                                                                else
                                                                                                if($row['out_of_order'] == 1)
                                                                                                {
                                                                                                    echo '<p style="color:red;">Out of Order</p>';
                                                                                                }
                                                                                            ?>
                                                                                        </div>
                                                                                        <div class="sub-menu-icon">
                                                                                            <i class="fas fa-angle-down" data-id="<?php echo $row['id']?>" onclick="openMenuExtraSection(<?php echo $row['id'];?>)" data-count=""style="font-size: 19px;"></i>
                                                                                        </div>
                                                                                        
                                                                                    </div>
                                                                                </div>
                                                                                <!-- Edit menu item  -->
                                                                                <div id="main_menu_item_edit_div_<?php echo $row['id']?>"></div>
                                                                                <!-- Show Menu Extra Section  -->
                                                                                <div class="soft-drink-section soft-drink-section<?php echo $row['id']?>" style="margin-bottom: 20px;">
                                                                                <?php 
                                                                                    foreach($row['RestaurantMenuExtraSection'] as $sectionRow)
                                                                                    {
                                                                                        ?>
                                                                                            <div class="soft-drink">
                                                                                                <div class="drink-row">
                                                                                                    <div class="col-50-drink-left">
                                                                                                        <h2><?php echo $sectionRow['name']?></h2>
                                                                                                    </div>
                                                                                                    <div class="col-50-drink-right">
                                                                                                    <a href="javascript:;" class="main_menu_item_section_edit"
                                                                                                        data-restaurant-id='<?php echo $id?>' data-menu-item-id="<?php echo $row['id']?>"
                                                                                                        data-section-id="<?php echo $sectionRow['id']?>" data-section-name="<?php echo $sectionRow['name']?>"
                                                                                                        data-section-required="<?php echo $sectionRow['required']?>"
                                                                                                    >
                                                                                                        <i title="Edit User" class="fas fa-edit"></i>
                                                                                                    </a>&nbsp;&nbsp;
                                                                                                        <a onclick="return confirmAction()" href="process.php?action=deleteMenuExtraSection&id=<?php echo $sectionRow['id']?>&restaurant_id=<?php echo $id;?>">
                                                                                                            <i class="fas fa-trash-alt" style="color:#90908f;cursor: pointer;" ></i>
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div id="main_menu_item_section_edit_div_<?php echo $sectionRow['id']?>"></div>
                                                                                                <div class="drink-section-body">
                                                                                                    <!-- Show Section Extra Item -->
                                                                                                    <?php
                                                                                                        foreach($sectionRow['RestaurantMenuExtraItem'] as $extraItem)
                                                                                                        {
                                                                                                            if($sectionRow['id'] == $extraItem['restaurant_menu_extra_section_id'])
                                                                                                            {
                                                                                                                ?>
                                                                                                                    <div class="drink-name-wrapper">
                                                                                                                        <div class="drinkname">
                                                                                                                            <h2><?php echo $extraItem['name']?></h2>
                                                                                                                        </div>
                                                                                                                        <div class="drink-price">
                                                                                                                            $<?php echo $extraItem['price']?>&nbsp;&nbsp;
                                                                                                                            <a href="javascript:;" class="section-extra-item"
                                                                                                                                data-restaurant-id='<?php echo $id?>' data-section-id="<?php echo $sectionRow['id']?>" 
                                                                                                                                data-extra-item-id="<?php echo $extraItem['id']?>" data-extra-section-name="<?php echo $extraItem['name']?>"
                                                                                                                                data-extra-section-price="<?php echo $extraItem['price']?>"
                                                                                                                            >
                                                                                                                                <i title="Edit User" class="fas fa-edit" style="font-size:14px;color:#90908f;cursor: pointer;" ></i>&nbsp;&nbsp;
                                                                                                                            </a>
                                                                                                                            <a onclick="return confirmAction()" href="process.php?action=deleteMenuExtraItem&id=<?php echo $extraItem['id']?>&restaurant_id=<?php echo $id;?>">
                                                                                                                                <i class="fas fa-trash-alt" style="color:#90908f;cursor: pointer;" ></i>
                                                                                                                            </a>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div id="section-extra-item-<?php echo $extraItem['id']?>"></div>
                                                                                                                <?php
                                                                                                            }
                                                                                                        }
                                                                                                    ?>
                                                                                                    <!-- Add Section Extra Item -->
                                                                                                    <div class="footer-drink">
                                                                                                        <div class="addmenu">
                                                                                                            <h3 class="addnewmenu_extraitem" data-menu-extra-section-id='<?php echo $sectionRow['id']?>' data-restaurant-id="<?php echo $id;?>">
                                                                                                                <i class="fa fa-plus-circle" style="margin-right: 5px;"></i> Add Section Extra Item
                                                                                                            </h3>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        <?php
                                                                                    }
                                                                                ?>
                                                                                    <!-- Add Menu Extra Section  -->
                                                                                    <div class="menu-extra-section">
                                                                                        <h3 class="addnewmenu_extrasection" data-restaurant-menu-item-id="<?php echo $row['id']?>" data-restaurant-id="<?php echo $id;?>">
                                                                                            <i class="fa fa-plus-circle" style="margin-right: 5px;"></i> Add Menu Extra Section
                                                                                        </h3>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                            <?php
                                                                        }
                                                                    ?>
                                                                    <div class="add_new_menu">
                                                                        <div class="addmenu" style="margin-top: 0;">
                                                                            <h3 class="addnewmenu_item" data-menu-id="<?php echo $singleRow['RestaurantMenu']['id']?>" data-restaurant-id="<?php echo $id;?>">
                                                                                <i class="fa fa-plus-circle"tyle="margin-right: 5px;"></i> 
                                                                                Add New Menu Item
                                                                            </h3>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        <?php
                                                    }
                                                }
                                            ?>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </section>
                </div>
            </div>
        <?php
    } 
    else 
    {
        echo "<script>window.location='index.php'</script>";
        die;
    }
?>



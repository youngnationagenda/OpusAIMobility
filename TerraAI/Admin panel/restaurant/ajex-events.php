
<?php
include("config.php");
if(isset($_GET['q']))
{
    
    if (@$_GET['q'] == "changePassword")
    {
        ?>
            <form name="" method="post" action="process.php?action=currentAdminChangePassword">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Change Password</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Current Password</label>
                            <input type="password" name="old_password" required>
                            <input type="hidden" name="user_id" value="<?php echo $_SESSION[PRE_FIX.'id']; ?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">New Password</label>
                            <input type="Password" name="new_password" required id="new-password" onchange="validatePassword()">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Confirm Password</label>
                            <input type="password" name="" required id="confirme-password" onkeyup="validatePassword()">
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addUser")
    {
        // get all countries 
        $url = $baseurl . 'showCountries';
        $data = array();
        $json_data = @curl_request($data,$url);

        ?>
            <form name="" method="post" action="process.php?action=addUser">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Register User</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required>
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Phone</label>
                            <input type="number" name="phone" required>
                        </div>
                    </div>  
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Password</label>
                            <input type="password" name="password" required>
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Country</label>
                            <Select class="countrySelect" name="country_id" required>
                                <option value="">Select Country</option>
                                <?php 
                                    foreach($json_data['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['Country']['id'];?>" ><?php $countryName= strtolower($row['Country']['name']); echo ucwords($countryName);?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addRider")
    {
        // get all countries 
        $url = $baseurl . 'showCountries';
        $data = array();
        $json_data = @curl_request($data,$url);
        ?>
            <form method="post" action="process.php?action=addRider">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Rider</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required>
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Phone</label>
                            <input type="number" name="phone" required>
                        </div>
                    </div>  
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Password</label>
                            <input type="password" name="password" required>
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Country</label>
                            <Select class="countrySelect" name="country_id" required>
                                <option value="">Select Country</option>
                                <?php 
                                    foreach($json_data['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['Country']['id'];?>" ><?php $countryName= strtolower($row['Country']['name']); echo ucwords($countryName);?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>  
                </div>    
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "showRiders")
    {
        $order_id=$_GET['order_id'];
        
        // get all riders 
        $url = $baseurl . 'showRiders';
        $data = array(
            "food_order_id" => $order_id
        );
        $json_data = @curl_request($data, $url);

        ?>
            <form method="post" action="process.php?action=assignOrderToRider">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Select Rider</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>" required>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Rider</label>
                            <Select class="countrySelect" name="rider_id" required>
                                <option value="">Select Riders</option>
                                <?php 
                                    foreach($json_data['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['User']['id'];?>" ><?php echo ucwords($row['User']['first_name'].' '.$row['User']['last_name']); ?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php 
    }
    else
    if (@$_GET['q'] == "parcel_assignRider")
    {
        $order_id=$_GET['order_id'];
        
        // get all riders 
        $url = $baseurl . 'showRiders';
        $data = array(
            "parcel_order_id" => $order_id
        );
        $json_data = @curl_request($data, $url);

        ?>
            <form method="post" action="process.php?action=parcel_assignOrderToRider">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Select Rider</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>" required>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Rider</label>
                            <Select class="countrySelect" name="rider_id" required>
                                <option value="">Select Riders</option>
                                <?php 
                                    foreach($json_data['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['User']['id'];?>" ><?php echo ucwords($row['User']['first_name'].' '.$row['User']['last_name']); ?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php 
    }
    else
    if (@$_GET['q'] == "changeFoodOrderStatus")
    {
        $order_id=$_GET['order_id'];
        
        
        ?>
            <form method="post" action="process.php?action=changeFoodOrderStatus">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Change Order Status</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>" required>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Status</label>
                            <Select class="countrySelect" name="status" required>
                                <option value="">Select Status</option>
                                <option value="2">Completed</option>
                            </Select>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php 
    }
    else
    if (@$_GET['q'] == "parcel_changeStatus")
    {
        $order_id=$_GET['order_id'];
        ?>
            <form method="post" action="process.php?action=parcel_changeStatus">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Change Order Status</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>" required>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Status</label>
                            <Select class="countrySelect" name="status" required>
                                <option value="">Select Status</option>
                                <option value="2">Completed</option>
                                <option value="3">Cancel</option>
                            </Select>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php 
    }
    else
    if (@$_GET['q'] == "editUser")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showUsers';
        $data = array(
            'user_id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        // get all countries 
        $url = $baseurl . 'showCountries';
        $data = array();
        $allcountrirs=@curl_request($data,$url);
        ?>
            <form name="" method="post" action="process.php?action=editUser">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit User</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="user_id" id="" value="<?php echo $json_data['User']['id'];?>">
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required value="<?php echo $json_data['User']['first_name'];?>">
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required value="<?php echo $json_data['User']['last_name'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Phone</label>
                            <input type="text" name="phone" required value="<?php echo $json_data['User']['phone'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required value="<?php echo $json_data['User']['email'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Country</label>
                            <Select class="countrySelect" name="country_id" required>
                                <option value="">Select Country</option>
                                <?php 
                                    foreach($allcountrirs['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['Country']['id'];?>" <?php if($row['Country']['id'] == $json_data['Country']['id'] ){ echo ' selected="selected"';}?>><?php $countryName= strtolower($row['Country']['name']); echo ucwords($countryName);?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>    
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editRider")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showUsers';
        $data = array(
            'user_id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        // get all countries 
        $url = $baseurl . 'showCountries';
        $data = array();
        $allcountrirs=@curl_request($data,$url);
        ?>
            <form name="" method="post" action="process.php?action=editRider">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Rider</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="user_id" id="" value="<?php echo $json_data['User']['id'];?>">
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required value="<?php echo $json_data['User']['first_name'];?>">
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required value="<?php echo $json_data['User']['last_name'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Phone</label>
                            <input type="text" name="phone" required value="<?php echo $json_data['User']['phone'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required value="<?php echo $json_data['User']['email'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Country</label>
                            <Select class="countrySelect" name="country_id" required>
                                <option value="">Select Country</option>
                                <?php 
                                    foreach($allcountrirs['msg'] as $row):
                                        ?>
                                            <option value="<?php echo $row['Country']['id'];?>" <?php if($row['Country']['id'] == $json_data['Country']['id'] ){ echo ' selected="selected"';}?>><?php $countryName= strtolower($row['Country']['name']); echo ucwords($countryName);?></option>
                                        <?php 
                                    endforeach;
                                ?>
                            </Select>
                        </div>
                    </div>    
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addAdminUser")
    {
        ?>
            <form name="" method="post" action="process.php?action=addAdminUser">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Create a new Admin</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required>
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required>
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Password</label>
                            <input type="password" name="password" required>
                        </div>
                    </div>   
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editAdminUser")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showAdminUsers';
        $data = array(
            'id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editAdminUser">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Admin</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="admin_id" id="" value="<?php echo $json_data['Admin']['id'];?>">
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label for="usename">First Name</label>
                            <input type="text" name="first_name" required value="<?php echo $json_data['Admin']['first_name'];?>">
        
                        </div>
                        <div class="name-input-container">
                            <label for="email">Last Name</label>
                            <input type="text" name="last_name" required value="<?php echo $json_data['Admin']['last_name'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Email</label>
                            <input type="mail" name="email" required value="<?php echo $json_data['Admin']['email'];?>">
                        </div>
                    </div>   
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "changeAdminPassword")
    {
        $id=$_GET['id'];
        ?>
            <form name="" method="post" action="process.php?action=changeAdminPassword">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Change Password</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">New Password</label>
                            <input type="Password" name="new_password" required id="new-password" onchange="validatePassword()">
                            <input type="hidden" name="user_id" value="<?php echo $id?>">
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addFoodCategory")
    {

        ?>
            <form name="" method="post" action="process.php?action=addFoodCategory" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Food Category</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input type="text" name="title" required>
        
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="email">Image</label>
                            <input type="file" name="image" required accept=".jpg, .jpeg, .png">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Icon</label>
                            <input type="file" name="icon" required accept=".jpg, .jpeg, .png">
                        </div>
                    </div>   
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editFoodCategory")
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showFoodCategory';
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data, $url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editFoodCategory" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Food Category</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="id" value="<?php echo $id?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input type="text" name="title" required value="<?php echo $json_data['FoodCategory']['title']; ?>">
        
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="email">Image</label>
                            <input type="file" name="image" required accept=".jpg, .jpeg, .png">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Icon</label>
                            <input type="file" name="icon" required accept=".jpg, .jpeg, .png">
                        </div>
                    </div>   
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "restaurantOwnerResponse")
    {
        $id = $_GET['id'];
        
        ?>
            <form name="" method="post" action="process.php?action=restaurantOwnerResponse" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Reject Order</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="order_id" value="<?php echo $id?>">
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="usename">Reason</label>
                            <textarea cols="30" rows="5" name="reason"></textarea>
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addPackageSize")
    {

        ?>
            <form name="" method="post" action="process.php?action=addPackageSize" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Package Size</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Description</label>
                            <input  type="text" required="" name="description">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Price</label>
                            <input name="price" type="number" required="" >
                        </div>
                    </div>   
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png" required>
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editPackageSize")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showPackageSize';
        $data = array(
            'id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editPackageSize" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Package Size</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="id" value="<?php echo $json_data['PackageSize']['id'];?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name" value="<?php echo $json_data['PackageSize']['title'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Description</label>
                            <input  type="text" required="" name="description" value="<?php echo $json_data['PackageSize']['description'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Price</label>
                            <input name="price" type="number" required="" value="<?php echo $json_data['PackageSize']['price'];?>">
                        </div>
                    </div>   
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png">
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addRideType")
    {

        ?>
            <form name="" method="post" action="process.php?action=addRideType" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Ride Type</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow-y:scrool;max-height:350px;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Description</label>
                            <input  type="text" required="" name="description">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Passenger Capacity</label>
                            <input name="passenger_capacity" type="number" value="3" required="" >
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Base Fare ($)</label>
                            <input name="base_fare" type="number" value="10" required="" >
                        </div>
                    </div>  
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Cost Per Minute ($)</label>
                            <input name="cost_per_minute" type="number" value="3" required="" >
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Cost Per Distance ($)</label>
                            <input name="cost_per_distance" type="number" value="5" required="" >
                            
                            <div style="text-align: center;background:white;width: 180px;margin-top: -30px;position: relative;float: right;margin-right: 5px;">
                                <label  for="miles">
                                    <input type="radio" id="miles" name="distance_type" value="M" style="width: auto;">
                                    Mile
                                </label >
                                
                                <label  for="kilometer">
                                    <input type="radio" id="kilometer" name="distance_type" value="K" style="width: auto;" checked>
                                    Kilometer
                                </label >
                                
                            </div>
                            <div style="clear:both;"></div>
                            
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editRideType")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showRideTypes';
        $data = array(
            'id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editRideType" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Ride Type</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow-y:scrool;max-height:350px;">
                    <input type="hidden" name="id" value="<?php echo $json_data['RideType']['id'];?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name" value="<?php echo $json_data['RideType']['name'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Description</label>
                            <input  type="text" required="" name="description" value="<?php echo $json_data['RideType']['description'];?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Passenger Capacity</label>
                            <input name="passenger_capacity" type="number" required="" value="<?php echo $json_data['RideType']['passenger_capacity'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Base Fare ($)</label>
                            <input name="base_fare" type="number" required="" value="<?php echo $json_data['RideType']['base_fare'];?>">
                        </div>
                    </div>  
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Cost Per Minute ($)</label>
                            <input name="cost_per_minute" type="number" required="" value="<?php echo $json_data['RideType']['cost_per_minute'];?>">
                        </div>
                    </div> 
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Cost Per Distance ($)</label>
                            <input name="cost_per_distance" type="number" required="" value="<?php echo $json_data['RideType']['cost_per_distance'];?>">
                            
                            <div style="text-align: center;background:white;width: 180px;margin-top: -30px;position: relative;float: right;margin-right: 5px;">
                                <label  for="miles">
                                    <input type="radio" id="miles" name="distance_type" value="M" style="width: auto;" <?php if($json_data['RideType']['distance_unit']=="M"){ echo "checked"; } ?> >
                                    Mile
                                </label >
                                
                                <label  for="kilometer">
                                    <input type="radio" id="kilometer" name="distance_type" value="K" style="width: auto;" <?php if($json_data['RideType']['distance_unit']=="K"){ echo "checked"; } ?>>
                                    Kilometer
                                </label >
                                
                            </div>
                            <div style="clear:both;"></div>
                            
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addGoodType")
    {

        ?>
            <form name="" method="post" action="process.php?action=addGoodType" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Good Type</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name">
                        </div>
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editGoodType")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showGoodTypes';
        $data = array(
            'id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editGoodType" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Good Type</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" value="<?php echo $json_data['GoodType']['id'];?>" name="id">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name" value="<?php echo $json_data['GoodType']['name'];?>">
                        </div>
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addSliderImage")
    {

        ?>
            <form name="" method="post" action="process.php?action=addSliderImage" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Slider Image</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">  
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" required accept=".jpg, .jpeg, .png">
                        </div>
                    </div> 
                    
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="usename">URL</label>
                            <input type="text" name="url">
                        </div>
                    </div>
                    
                </div>
                
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addRestaurant")
    {

        ?>
            <form method="post" action="process.php?action=addRestaurant" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Restaurant</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;max-height: 400px; overflow-y: scrool;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Lat</label>
                            <input  type="text" required="" name="lat">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Long</label>
                            <input  type="text" required="" name="long">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Min Order Price</label>
                            <input  type="text" required="" name="min_order_price">
                        </div>
                    </div>
                    
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Fee</label>
                            <input  type="text" required="" name="delivery_fee">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Min Time</label>
                            <input  type="text" required="" name="delivery_min_time">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Max Time</label>
                            <input  type="text" required="" name="delivery_max_time">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png">
                        </div>
                    </div> 
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editRestaurant")
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showRestaurants'; 
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data, $url);
        $json_data = $json_data['msg'];
        
        
        ?>
            <form method="post" action="process.php?action=editRestaurant" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Restaurant</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                
                <div class="modal-body modelHeight" style="height: auto;max-height: 400px; overflow-y: scrool;">
                    <input  type="hidden" name="id" value="<?php echo $json_data['Restaurant']['id']?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name" value="<?php echo $json_data['Restaurant']['name']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Lat</label>
                            <input  type="text" required="" name="lat" value="<?php echo $json_data['Restaurant']['lat']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Long</label>
                            <input  type="text" required="" name="long"  value="<?php echo $json_data['Restaurant']['long']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Min Order Price</label>
                            <input  type="text" required="" name="min_order_price" value="<?php echo $json_data['Restaurant']['min_order_price']?>">
                        </div>
                    </div>
                    
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Fee</label>
                            <input  type="text" required="" name="delivery_fee" value="<?php echo $json_data['Restaurant']['delivery_fee']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Min Time</label>
                            <input  type="text" required="" name="delivery_min_time" value="<?php echo $json_data['Restaurant']['delivery_min_time']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label>Delivery Max Time</label>
                            <input  type="text" required="" name="delivery_max_time" value="<?php echo $json_data['Restaurant']['delivery_max_time']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png">
                        </div>
                    </div> 
                </div>
                
                
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addRestaurantTiming")
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showRestaurants'; 
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data, $url);
        $json_data = $json_data['msg'];
        
        if(count($json_data['RestaurantTiming'])!=0)
        {
            $sundayOpeningTime=$json_data['RestaurantTiming'][0]['opening_time'];
            $sundayClosingTime=$json_data['RestaurantTiming'][0]['closing_time'];
            
            $mondayOpeningTime=$json_data['RestaurantTiming'][1]['opening_time'];
            $mondayClosingTime=$json_data['RestaurantTiming'][1]['closing_time'];
            
            $tuesdayOpeningTime=$json_data['RestaurantTiming'][2]['opening_time'];
            $tuesdayClosingTime=$json_data['RestaurantTiming'][2]['closing_time'];
            
            $wednessdayOpeningTime=$json_data['RestaurantTiming'][3]['opening_time'];
            $wednessdayClosingTime=$json_data['RestaurantTiming'][3]['closing_time'];
            
            $thursdayOpeningTime=$json_data['RestaurantTiming'][4]['opening_time'];
            $thursdayClosingTime=$json_data['RestaurantTiming'][4]['closing_time'];
            
            $fridayOpeningTime=$json_data['RestaurantTiming'][5]['opening_time'];
            $fridayClosingTime=$json_data['RestaurantTiming'][5]['closing_time'];
            
            $saturdayOpeningTime=$json_data['RestaurantTiming'][6]['opening_time'];
            $saturdayClosingTime=$json_data['RestaurantTiming'][6]['closing_time'];    
        }
        else
        {
            $sundayOpeningTime="";
            $sundayClosingTime="";
            
            $mondayOpeningTime="";
            $mondayClosingTime="";
            
            $tuesdayOpeningTime="";
            $tuesdayClosingTime="";
            
            $wednessdayOpeningTime="";
            $wednessdayClosingTime="";
            
            $thursdayOpeningTime="";
            $thursdayClosingTime="";
            
            $fridayOpeningTime="";
            $fridayClosingTime="";
            
            $saturdayOpeningTime="";
            $saturdayClosingTime="";
        }
        
        
        ?>
            <form name="" method="post" action="process.php?action=addRestaurantTiming">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Restaurant Timing</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight">
                    
                    
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Sunday"  readonly>
                        </div>
                    </div>
                    <input type="hidden" name="restaurant_id" value="<?php echo $id;?>">
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$sundayOpeningTime){ echo "selected"; } ?> ><?php echo $time; ?></option>
                                        <?php
                                    }


                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$sundayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    
                    
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Monday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$mondayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }


                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$mondayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Tuesday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$tuesdayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }


                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$tuesdayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Wednesday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$wednessdayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$wednessdayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Thursday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$thursdayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$thursdayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Friday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$fridayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$fridayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="input-email-container" style="margin-bottom:16px;">
                        <div class="email-input-container">
                            <input name="day[]" type="text" value="Saturday"  readonly>
                        </div>
                    </div>
                    <div class="input-username-container">
                        <div class="name-input-container">
                            <label class="field_title">Opening Time</label> 
                            <select name="opening_time[]" class="countrySelect" required="">
                                <option value="">Select Opening Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$saturdayOpeningTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                        <div class="name-input-container">
                            <label class="field_title">Closing Time</label> 
                            <select name="closing_time[]" class="countrySelect" required="">
                                <option value="">Select Closing Time</option>
                                <?php

                                    for($i = 0; $i<=23; $i++) 
                                    {
                                        if($i<10)
                                        {
                                            $time="0".$i.":00:00";
                                        }
                                        else
                                        {
                                            $time=$i.":00:00";
                                        }
                                        
                                        ?>
                                            <option value="<?php echo $time; ?>" <?php if($time==$saturdayClosingTime){ echo "selected"; } ?>><?php echo $time; ?></option>
                                        <?php
                                    }

                                ?>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addRestaurantCategory")
    {
        $url = $baseurl . 'showFoodCategory'; 
        $data = array();
        $json_data = @curl_request($data, $url);
        
        $id = $_GET['id'];
        $url = $baseurl . 'showRestaurants'; 
        $data = array(
            'id' => $id
        );
        $json_data_showRestaurants = @curl_request($data, $url);
        
        
        ?>
            <form name="" method="post" action="process.php?action=addRestaurantCategory">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Restaurant Category</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight">
                    
                    <input type="hidden" name="restaurant_id" value="<?php echo $id;?>">
                    <?php
                        if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                        {
                            
                            foreach ($json_data['msg'] as $singleRow) 
                            {
                                
                                $categoryArray = array();
                                foreach ($json_data_showRestaurants['msg']['RestaurantCategory'] as $singleRow_showRestaurants) 
                                {
                                    $categoryArray[] .= $singleRow_showRestaurants['food_category_id'];
                                }
                                
                                ?>
                                    <div>
                                        <div class="email-input-container">
                                            <input  type="checkbox" id="<?php echo $singleRow['FoodCategory']['id'];?>" value="<?php echo $singleRow['FoodCategory']['id'];?>" name="categoryId[]" <?php if(in_array($singleRow['FoodCategory']['id'], $categoryArray)){echo "checked";} ?> >
                                            <label for="<?php echo $singleRow['FoodCategory']['id']; ?>">
                                                <?php
                                                    echo $singleRow['FoodCategory']['title'];
                                                ?>
                                            </label>
                                        </div>
                                    </div>
                                <?php
                            }
                        }   
                    ?>
                    
                    
                    
                    
                    
                    
                    
                    
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
        
    }
    else
    if (@$_GET['q'] == "addCoupon")
    {

        ?>
            <form name="" method="post" action="process.php?action=addCoupon" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Coupon</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Coupon Code</label>
                            <input  type="text" required="" name="coupon_code">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Limit Users</label>
                            <input  type="number" required="" name="limit_users">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Discount</label>
                            <input  type="number" required="" name="discount">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Expiry Date</label>
                            <input  type="date" required="" name="expiry_date">
                        </div>
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editCoupon")
    {
        $id=$_GET['id'];
        $url = $baseurl . 'showCoupons';
        $data = array(
            'coupon_id' => $id
        );
        $json_data=@curl_request($data,$url);
        $json_data =$json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editCoupon" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Coupon</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                    <input type="hidden" name="coupon_id" value="<?php echo $json_data['Coupon']['id'];?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Coupon Code</label>
                            <input  type="text" required="" name="coupon_code" value="<?php echo $json_data['Coupon']['coupon_code'];?>">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Limit Users</label>
                            <input  type="number" required="" name="limit_users" value="<?php echo $json_data['Coupon']['limit_users'];?>">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Discount</label>
                            <input  type="number" required="" name="discount" value="<?php echo $json_data['Coupon']['discount'];?>">
                        </div>
                        <div class="email-input-container">
                            <label for="usename">Expiry Date</label>
                            <input  type="date" required="" name="expiry_date" value="<?php echo $json_data['Coupon']['expiry_date'];?>">
                        </div>
                    </div>
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addMenu")
    {
        $id = $_GET['id'];
        ?>
            <form name="" method="post" action="process.php?action=addMenu" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Menu</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;max-height: 400px; overflow-y: scrool;">
                    <input type="hidden" name="restaurant_id" value="<?php echo $id;?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name">
                        </div>
                    </div>
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Description</label>
                            <input  type="text" required="" name="description">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png">
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editMenu")
    {
        $id = $_GET['id'];
        $restaurant_id = $_GET['restaurant_id'];
        $url = $baseurl . 'showMainMenus'; 
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data, $url);
        $json_data = $json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editMenu" enctype="multipart/form-data">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Menu</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;max-height: 400px; overflow-y: scrool;">
                    <input type="hidden" name="id" value="<?php echo $id;?>">
                    <input type="hidden" name="restaurant_id" value="<?php echo $restaurant_id;?>">
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">Name</label>
                            <input  type="text" required="" name="name" value="<?php echo $json_data['RestaurantMenu']['name'];?>">
                        </div>
                    </div>
                    <div class="input-email-container mt-0">
                        <div class="email-input-container">
                            <label for="usename">description</label>
                            <input  type="text" required="" name="description" value="<?php echo $json_data['RestaurantMenu']['description']?>">
                        </div>
                    </div>
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label class="">Image</label>
                            <input  type="file" name="image" accept=".jpg, .jpeg, .png">
                        </div>
                    </div>  
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "addReportReason")
    {
        ?>
            <form name="" method="post" action="process.php?action=addReportReason">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Add Report Reason</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                   
                    <div class="input-email-container" style="margin-top:0px;">
                        <div class="email-input-container">
                            <label for="address">Name</label>
                            <input type="text" name="title" required>
                        </div>
                    </div>    
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editReportReason")
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showReportReasons';
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data,$url);
        $json_data = $json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editReportReason">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Edit Report Reason</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                   
                    <div class="input-email-container" style="margin-top:0px;">
                        <input type="hidden" name="id" value='<?php echo $id?>'>
                        <div class="email-input-container">
                            <label for="address">Name</label>
                            <input type="text" name="title" required value="<?php echo $json_data['ReportReason']['title'];?>">
                        </div>
                    </div>    
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    else
    if (@$_GET['q'] == "editServiceFee")
    {
        $id = $_GET['id'];
        $url = $baseurl . 'showServiceCharges';
        $data = array(
            'id' => $id
        );
        $json_data = @curl_request($data,$url);
        $json_data = $json_data['msg'];
        ?>
            <form name="" method="post" action="process.php?action=editServiceFee">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Modify Service Fee</h5>
                    <button type="button" class="close" onclick="ClosePopup();">
                        <span aria-hidden="true">
                            <i class="fal fa-times"></i>
                        </span>
                    </button>
                </div>
                <div class="modal-body modelHeight" style="height: auto;overflow: unset;">
                   <input type="hidden" name="id" value='<?php echo $id?>'>
                    
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Name</label>
                            <input type="text" name="title" value="<?php echo ucwords(str_replace("_"," ",$json_data['ServiceCharge']['module'])); ?>" disabled>
                        </div>
                    </div> 
                    
                    <div class="input-email-container">
                        <div class="email-input-container">
                            <label for="address">Commission</label>
                            <input type="text" name="Commission" value="<?php echo $json_data['ServiceCharge']['value']; ?>">
                        </div>
                        
                        <div style="text-align: center;background:white;width: 180px;margin-top: -30px;position: relative;float: right;margin-right: 5px;">
                            <label for="percentage">
                                <input type="radio" id="percentage" name="feeType" value="1" style="width: auto;" <?php if($json_data['ServiceCharge']['type']=="1"){ echo "checked"; } ?>>
                                Percentage
                            </label >
                            
                            <label for="fixed">
                                <input type="radio" id="fixed" name="feeType" value="2" style="width: auto;" <?php if($json_data['ServiceCharge']['type']=="2"){ echo "checked"; } ?>>
                                Fixed
                            </label >
                            
                        </div>
                        <div style="clear:both;"></div>
                    </div>  
                    
                </div>
                <div class="modal-footer mt-3">
                    <button type="button" class="footer-card-btn" onclick="ClosePopup();">Cancel</button>
                    <button type="submit" class="add-product-btn px-3">Save</button>
                </div>
            </form>
        <?php
    }
    
}
?>


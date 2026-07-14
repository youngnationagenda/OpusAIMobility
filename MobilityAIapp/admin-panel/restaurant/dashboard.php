
<?php 
    include("config.php");
    if(isset($_SESSION[PRE_FIX.'id'])) 
    {
        include("header.php"); 
        include("navbar.php");
        include("rightsidebar.php");   
            if(isset($_GET['p']) ) 
            { 
                if(isset($_SESSION[PRE_FIX.'success']))
                {
                    if($_SESSION[PRE_FIX.'success']!="")
                    {
                        ?>
                            <div class="actionBar success">
                                <h6 style="margin: 0px;font-size: 14px;">Success</h6>
                                <p style="margin: 0px;font-size: 14px;">
                                    Action has been performed.
                                </p>
                            </div>
                        <?php
                        $_SESSION[PRE_FIX.'success'] = "";
                    }
                }
                
                if(isset($_SESSION[PRE_FIX.'error']))
                {
                    if($_SESSION[PRE_FIX.'error']!="")
                    {
                        ?>
                            <div class="actionBar error">
                                <h6 style="margin: 0px;font-size: 14px;">Error</h6>
                                <p style="margin: 0px;font-size: 14px;">
                                    <?php
                                        if(isset($_SESSION[PRE_FIX.'error']))
                                        {
                                            echo $_SESSION[PRE_FIX.'error'];
                                        }
                                        else
                                        {
                                            echo "Action did not performed";
                                        }
                                    ?>
                                </p>
                            </div>
                        <?php
                        $_SESSION[PRE_FIX.'error'] = "";
                    }
                }
                
                
                
                if( $_GET['p'] == "users" ) 
                { 
                    include("users.php");
                }
                if( $_GET['p'] == "changePassword") 
                { 
                    include("changePassword.php");
                }
                if( $_GET['p'] == "setting" ) 
                { 
                    include("setting.php");
                }
                if( $_GET['p'] == "manageCountry") 
                { 
                    include("manageCountry.php");
                }
                if( $_GET['p'] == "manageAdmin") 
                { 
                    include("manageAdmin.php");
                }
                if( $_GET['p'] == "manageLanguage") 
                { 
                    include("manageLanguage.php");
                }
                if( $_GET['p'] == "dropDown") 
                { 
                    include("dropDown.php");
                }
                if( $_GET['p'] == "restaurants") 
                { 
                    include("restaurants.php");
                }
                if( $_GET['p'] == "foodCategory") 
                { 
                    include("foodCategory.php");
                }
                if( $_GET['p'] == "foodOrders") 
                { 
                    include("foodOrders.php");
                }
                if( $_GET['p'] == "packageSize") 
                { 
                    include("packageSize.php");
                }
                if( $_GET['p'] == "rideTypes") 
                { 
                    include("showRideTypes.php");
                }
                if( $_GET['p'] == "goodType") 
                { 
                    include("goodType.php");
                }
                if( $_GET['p'] == "showParcelOrders") 
                { 
                    include("showParcelOrders.php");
                }
                if( $_GET['p'] == "rider") 
                { 
                    include("rider.php");
                }
                if( $_GET['p'] == "showVehicles") 
                { 
                    include("showVehicles.php");
                }
                if( $_GET['p'] == "sliderImage") 
                { 
                    include("showSlider.php");
                }
                if( $_GET['p'] == "restaurantManageMenu") 
                { 
                    include("restaurantManageMenu.php");
                }
                if( $_GET['p'] == "orderDetail") 
                { 
                    include("orderDetail.php");
                }
                if( $_GET['p'] == "parcelOrderDetail") 
                { 
                    include("parcelOrderDetail.php");
                }
                if( $_GET['p'] == "manageTrip") 
                { 
                    include("manageTrip.php");
                }
                if( $_GET['p'] == "manageServiceFee") 
                { 
                    include("manageServiceFee.php");
                }
                if( $_GET['p'] == "managePolicies") 
                { 
                    include("managePolicies.php");
                }
                if( $_GET['p'] == "manageCoupon") 
                { 
                    include("manageCoupon.php");
                }
                if( $_GET['p'] == "manageReportReasons") 
                { 
                    include("manageReportReasons.php");
                }
                if( $_GET['p'] == "userDetail") 
                { 
                    include("userDetail.php");
                }
                if( $_GET['p'] == "riderDetail") 
                { 
                    include("riderDetail.php");
                }
                if( $_GET['p'] == "tripRequest") 
                { 
                    include("tripRequest.php");
                }
                if( $_GET['p'] == "tripRequestDetails") 
                { 
                    include("tripRequestDetails.php");
                }
                
                if( $_GET['p'] == "tripDetails") 
                { 
                    include("tripDetails.php");
                }
                
                if( $_GET['p'] == "dashboard") 
                { 
                    include("dashboardData.php");
                }
                
                
                
                
            } 
    include("footer.php"); 
    }
    else
    {
        echo "<script>window.location='index.php'</script>";
    }
?>
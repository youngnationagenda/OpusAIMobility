<?php
    if (isset($_SESSION[PRE_FIX . 'id'])) 
    {
        $url = $baseurl . 'showRestaurantFoodOrders';
        
        ?>
            <div class="main-content-container">
                <div class="main-content-container-wrap">
                    <div class="content-page-header">
                        <div class="page-header-text">Food Orders</div>
                        <div class="page-header-btn">
                        </div>
                    </div>
                    <div class="content-page-container">
                        <div class="content-tabel-container">
                            <div class="content-tabel-nav">
                                <ul class="nav nav-tabs" id="myTab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link active" id="home-tab" data-toggle="tab" href="#All" role="tab" aria-controls="home" aria-selected="true">All</a>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link" id="profile-tab" data-toggle="tab" href="#pending" role="tab" aria-controls="profile" aria-selected="false">Pending</a>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link" id="contact-tab" data-toggle="tab" href="#active" role="tab" aria-controls="contact" aria-selected="false">Active</a>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link" id="completed-tab" data-toggle="tab" href="#completed" role="tab" aria-controls="completed" aria-selected="false">Completed</a>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link" id="ordercancel-tab" data-toggle="tab" href="#ordercancel" role="tab" aria-controls="ordercancel" aria-selected="false">Cancel</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="tab-content" id="myTabContent">
                                <div class="tab-pane fade show active" id="All" role="tabpanel" aria-labelledby="home-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Retaurant Name</th>
                                                    <th scope="col">Customer Name</th>
                                                    <th scope="col">Rider</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <?php
                                                $data = array(
                                                    "user_id" => $_SESSION[PRE_FIX . 'id']   
                                                );
                                                $json_data = @curl_request($data, $url);
                                                
                                                if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <tr>
                                                                <th scope="row">
                                                                    <div class="tabel-img-container">
                                                                        <input type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $singleRow['FoodOrder']['id']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo ucwords(strtolower($singleRow['Restaurant']['name'])) ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container" title="<?php echo $singleRow['User']['phone']; ?>">
                                                                        <?php echo $singleRow['User']['first_name']." ".$singleRow['User']['last_name']; ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php
                                                                            if($singleRow['FoodOrder']['status']=='1' || $singleRow['FoodOrder']['status']=='0')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                                else
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnActive assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">Assign Rider</span>
                                                                                    <?php
                                                                                }
                                                                            }
                                                                            else
                                                                            if($singleRow['FoodOrder']['status']=='2')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                echo "-";
                                                                            }
                                                                            
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $_SESSION[PRE_FIX.'currency_symbol'].$singleRow['FoodOrder']['price']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php 
                                                                            if($singleRow['FoodOrder']['status'] == '0')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnPending changeFoodOrderStatus" data-id='.$singleRow["FoodOrder"]["id"].' >Pending</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '1')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive changeFoodOrderStatus" data-id='.$singleRow["FoodOrder"]["id"].' >Active</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '2')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '3')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                                                            }
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                <td title="<?php echo $singleRow['FoodOrder']['created'];?>">
                                                                    <div class="td-container">
                                                                        <?php
                                                                            $timestamp = strtotime($singleRow['FoodOrder']['created']);
                                                                            echo date("d M Y", $timestamp);
                                                                        ?>
                                                                    </div>
                                                                    
                                                                </td>
                                                                <td>
                                                                    <div class="td-container"> 
                                                                        <div class="dropdown">
                                                                            <a href="dashboard.php?p=orderDetail&id=<?php echo $singleRow['FoodOrder']['id']?>"><i title="Order Detail" class="fas fa-clone" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;&nbsp;
                                                                            <?php
                                                                                if($singleRow['FoodOrder']['status'] == '0' || $singleRow['FoodOrder']['status'] == '1')
                                                                                {
                                                                                    ?>
                                                                                        <i title="Order Reject" onclick="restaurantOwnerResponse(<?php echo $singleRow['FoodOrder']['id']?>)" class="fas fa-times-circle fa-fw" style="color:rgb(247, 112, 130);cursor: pointer;"></i>&nbsp;&nbsp;
                                                                                    <?php
                                                                                }
                                                                            ?>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        <?php
                                                    }
                                                
                                                }
                                            ?>    
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="pending" role="tabpanel" aria-labelledby="profile-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Retaurant Name</th>
                                                    <th scope="col">Customer Name</th>
                                                    <th scope="col">Rider</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <?php
                                                $data = array(
                                                    "status" =>"0",
                                                    "user_id" => $_SESSION[PRE_FIX . 'id']
                                                );
                                                $json_data = @curl_request($data, $url);
                                                
                                                if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <tr>
                                                                <th scope="row">
                                                                    <div class="tabel-img-container">
                                                                        <input type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $singleRow['FoodOrder']['id']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo ucwords(strtolower($singleRow['Restaurant']['name'])) ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container" title="<?php echo $singleRow['User']['phone']; ?>">
                                                                        <?php echo $singleRow['User']['first_name']." ".$singleRow['User']['last_name']; ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php
                                                                            if($singleRow['FoodOrder']['status']=='1' || $singleRow['FoodOrder']['status']=='0')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                                else
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnActive assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">Assign Rider</span>
                                                                                    <?php
                                                                                }
                                                                            }
                                                                            else
                                                                            if($singleRow['FoodOrder']['status']=='2')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                echo "-";
                                                                            }
                                                                            
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $_SESSION[PRE_FIX.'currency_symbol'].$singleRow['FoodOrder']['price']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php 
                                                                            if($singleRow['FoodOrder']['status'] == '0')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnPending">Pending</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '1')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Active</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '2')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '3')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                                                            }
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                <td title="<?php echo $singleRow['FoodOrder']['created'];?>">
                                                                    <div class="td-container">
                                                                        <?php
                                                                            $timestamp = strtotime($singleRow['FoodOrder']['created']);
                                                                            echo date("d M Y", $timestamp);
                                                                        ?>
                                                                    </div>
                                                                    
                                                                </td>
                                                                <td>
                                                                    <div class="td-container"> 
                                                                        <div class="dropdown">
                                                                            <a href="dashboard.php?p=orderDetail&id=<?php echo $singleRow['FoodOrder']['id']?>"><i title="Order Detail" class="fas fa-clone" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;&nbsp;
                                                                            <?php
                                                                                if($singleRow['FoodOrder']['status'] == '0' || $singleRow['FoodOrder']['status'] == '1')
                                                                                {
                                                                                    ?>
                                                                                        <i title="Order Reject" onclick="restaurantOwnerResponse(<?php echo $singleRow['FoodOrder']['id']?>)" class="fas fa-times-circle fa-fw" style="color:rgb(247, 112, 130);cursor: pointer;"></i>&nbsp;&nbsp;
                                                                                    <?php
                                                                                }
                                                                            ?>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        <?php
                                                    }
                                                
                                                }
                                            ?>    
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="active" role="tabpanel" aria-labelledby="contact-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Retaurant Name</th>
                                                    <th scope="col">Customer Name</th>
                                                    <th scope="col">Rider</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <?php
                                                $data = array(
                                                    "status" =>"1",
                                                    "user_id" => $_SESSION[PRE_FIX . 'id']
                                                );
                                                $json_data = @curl_request($data, $url);
                                                
                                                if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <tr>
                                                                <th scope="row">
                                                                    <div class="tabel-img-container">
                                                                        <input type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $singleRow['FoodOrder']['id']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo ucwords(strtolower($singleRow['Restaurant']['name'])) ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container" title="<?php echo $singleRow['User']['phone']; ?>">
                                                                        <?php echo $singleRow['User']['first_name']." ".$singleRow['User']['last_name']; ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php
                                                                            if($singleRow['FoodOrder']['status']=='1' || $singleRow['FoodOrder']['status']=='0')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                                else
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnActive assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">Assign Rider</span>
                                                                                    <?php
                                                                                }
                                                                            }
                                                                            else
                                                                            if($singleRow['FoodOrder']['status']=='2')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                echo "-";
                                                                            }
                                                                            
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $_SESSION[PRE_FIX.'currency_symbol'].$singleRow['FoodOrder']['price']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php 
                                                                            if($singleRow['FoodOrder']['status'] == '0')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnPending">Pending</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '1')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Active</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '2')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '3')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                                                            }
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                <td title="<?php echo $singleRow['FoodOrder']['created'];?>">
                                                                    <div class="td-container">
                                                                        <?php
                                                                            $timestamp = strtotime($singleRow['FoodOrder']['created']);
                                                                            echo date("d M Y", $timestamp);
                                                                        ?>
                                                                    </div>
                                                                    
                                                                </td>
                                                                <td>
                                                                    <div class="td-container"> 
                                                                        <div class="dropdown">
                                                                            <a href="dashboard.php?p=orderDetail&id=<?php echo $singleRow['FoodOrder']['id']?>"><i title="Order Detail" class="fas fa-clone" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;&nbsp;
                                                                            <?php
                                                                                if($singleRow['FoodOrder']['status'] == '0' || $singleRow['FoodOrder']['status'] == '1')
                                                                                {
                                                                                    ?>
                                                                                        <i title="Order Reject" onclick="restaurantOwnerResponse(<?php echo $singleRow['FoodOrder']['id']?>)" class="fas fa-times-circle fa-fw" style="color:rgb(247, 112, 130);cursor: pointer;"></i>&nbsp;&nbsp;
                                                                                    <?php
                                                                                }
                                                                            ?>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        <?php
                                                    }
                                                }
                                            ?>    
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="completed" role="tabpanel" aria-labelledby="completed-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Retaurant Name</th>
                                                    <th scope="col">Customer Name</th>
                                                    <th scope="col">Rider</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <?php
                                                $data = array(
                                                    "status" =>"2",
                                                    "user_id" => $_SESSION[PRE_FIX . 'id']
                                                );
                                                $json_data = @curl_request($data, $url);
                                                
                                                if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <tr>
                                                                <th scope="row">
                                                                    <div class="tabel-img-container">
                                                                        <input type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $singleRow['FoodOrder']['id']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo ucwords(strtolower($singleRow['Restaurant']['name'])) ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container" title="<?php echo $singleRow['User']['phone']; ?>">
                                                                        <?php echo $singleRow['User']['first_name']." ".$singleRow['User']['last_name']; ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php
                                                                            if($singleRow['FoodOrder']['status']=='1' || $singleRow['FoodOrder']['status']=='0')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                                else
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnActive assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">Assign Rider</span>
                                                                                    <?php
                                                                                }
                                                                            }
                                                                            else
                                                                            if($singleRow['FoodOrder']['status']=='2')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                echo "-";
                                                                            }
                                                                            
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $_SESSION[PRE_FIX.'currency_symbol'].$singleRow['FoodOrder']['price']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php 
                                                                            if($singleRow['FoodOrder']['status'] == '0')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnPending">Pending</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '1')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Active</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '2')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '3')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                                                            }
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                <td title="<?php echo $singleRow['FoodOrder']['created'];?>">
                                                                    <div class="td-container">
                                                                        <?php
                                                                            $timestamp = strtotime($singleRow['FoodOrder']['created']);
                                                                            echo date("d M Y", $timestamp);
                                                                        ?>
                                                                    </div>
                                                                    
                                                                </td>
                                                                <td>
                                                                    <div class="td-container"> 
                                                                        <div class="dropdown">
                                                                            <a href="dashboard.php?p=orderDetail&id=<?php echo $singleRow['FoodOrder']['id']?>"><i title="Order Detail" class="fas fa-clone" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;&nbsp;
                                                                            <?php
                                                                                if($singleRow['FoodOrder']['status'] == '0' || $singleRow['FoodOrder']['status'] == '1')
                                                                                {
                                                                                    ?>
                                                                                        <i title="Order Reject" onclick="restaurantOwnerResponse(<?php echo $singleRow['FoodOrder']['id']?>)" class="fas fa-times-circle fa-fw" style="color:rgb(247, 112, 130);cursor: pointer;"></i>&nbsp;&nbsp;
                                                                                    <?php
                                                                                }
                                                                            ?>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        <?php
                                                    }
                                                }
                                            ?>    
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="ordercancel" role="tabpanel" aria-labelledby="ordercancel-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Retaurant Name</th>
                                                    <th scope="col">Customer Name</th>
                                                    <th scope="col">Rider</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <?php
                                                $data = array(
                                                    "status" =>"3",
                                                    "user_id" => $_SESSION[PRE_FIX . 'id']
                                                );
                                                $json_data = @curl_request($data, $url);
                                                
                                                if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
                                                {
                                                    foreach ($json_data['msg'] as $singleRow) 
                                                    {
                                                        ?>
                                                            <tr>
                                                                <th scope="row">
                                                                    <div class="tabel-img-container">
                                                                        <input type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $singleRow['FoodOrder']['id']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo ucwords(strtolower($singleRow['Restaurant']['name'])) ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container" title="<?php echo $singleRow['User']['phone']; ?>">
                                                                        <?php echo $singleRow['User']['first_name']." ".$singleRow['User']['last_name']; ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php
                                                                            if($singleRow['FoodOrder']['status']=='1' || $singleRow['FoodOrder']['status']=='0')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                                else
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnActive assignRider" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">Assign Rider</span>
                                                                                    <?php
                                                                                }
                                                                            }
                                                                            else
                                                                            if($singleRow['FoodOrder']['status']=='2')
                                                                            {
                                                                                if(count($singleRow['RiderOrder'])!='0')
                                                                                {
                                                                                    ?>
                                                                                        <span class="statusbtn statusBtnPending" data-id="<?php echo $singleRow['FoodOrder']['id']; ?>">
                                                                                            <?php echo $singleRow['RiderOrder']['Rider']['first_name']." ".$singleRow['RiderOrder']['Rider']['last_name']; ?>
                                                                                        </span>
                                                                                    <?php        
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                echo "-";
                                                                            }
                                                                            
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php echo $_SESSION[PRE_FIX.'currency_symbol'].$singleRow['FoodOrder']['price']; ?>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div class="td-container">
                                                                        <?php 
                                                                            if($singleRow['FoodOrder']['status'] == '0')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnPending">Pending</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '1')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Active</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '2')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                                                            }
                                                                            if($singleRow['FoodOrder']['status'] == '3')
                                                                            {
                                                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                                                            }
                                                                        ?>
                                                                    </div>
                                                                </td>
                                                                <td title="<?php echo $singleRow['FoodOrder']['created'];?>">
                                                                    <div class="td-container">
                                                                        <?php
                                                                            $timestamp = strtotime($singleRow['FoodOrder']['created']);
                                                                            echo date("d M Y", $timestamp);
                                                                        ?>
                                                                    </div>
                                                                    
                                                                </td>
                                                                <td>
                                                                    <div class="td-container"> 
                                                                        <div class="dropdown">
                                                                            <a href="dashboard.php?p=orderDetail&id=<?php echo $singleRow['FoodOrder']['id']?>"><i title="Order Detail" class="fas fa-clone" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;&nbsp;
                                                                            <?php
                                                                                if($singleRow['FoodOrder']['status'] == '0' || $singleRow['FoodOrder']['status'] == '1')
                                                                                {
                                                                                    ?>
                                                                                        <i title="Order Reject" onclick="restaurantOwnerResponse(<?php echo $singleRow['FoodOrder']['id']?>)" class="fas fa-times-circle fa-fw" style="color:rgb(247, 112, 130);cursor: pointer;"></i>&nbsp;&nbsp;
                                                                                    <?php
                                                                                }
                                                                            ?>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        <?php
                                                    }
                                                }
                                            ?>    
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
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
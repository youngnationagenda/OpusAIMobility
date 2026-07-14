<?php
    if (isset($_SESSION[PRE_FIX . 'id'])) 
    {
        $id= $_GET['id'];
        $url = $baseurl . 'showOrderDetail';
        $data = array(
            "food_order_id" => $id
        );
        
        $json_data = @curl_request($data, $url);
        $json_data = $json_data['msg'];
        
        ?>
            <div class="main-content-container">
                <div class="main-content-container-wrap">
                    <div class="content-page-header-container">
                        <div class="page-header-container-wrap">
                            <div class="page-header-content-container">
                                <div class="page-header-content-left">
                                    <div class="page-header-left-content">
                                        <h1>
                                           Order #<?php echo $id; ?>
                                        </h1>
                                        
                                        <?php
                                            if($json_data['FoodOrder']['cod']=="1")
                                            {
                                                echo '<span class="statusbtn statusBtnActive">Cash On Delivery</span>';
                                            }
                                            else
                                            {
                                                echo '<span class="statusbtn statusBtnActive">Credit Card</span>';
                                            }
                                            
                                            if($json_data['FoodOrder']['status'] == '0')
                                            {
                                                echo '<span class="statusbtn statusBtnPending">Pending</span>';
                                            }
                                            if($json_data['FoodOrder']['status'] == '1')
                                            {
                                                echo '<span class="statusbtn statusBtnActive">Active</span>';
                                            }
                                            if($json_data['FoodOrder']['status'] == '2')
                                            {
                                                echo '<span class="statusbtn statusBtnActive">Completed</span>';
                                            }
                                            if($json_data['FoodOrder']['status'] == '3')
                                            {
                                                echo '<span class="statusbtn statusBtnCancel">Cancel</span>';
                                            }
                                        ?>
                                    
                                    </div>
                                </div>
                                <div class="page-header-content-right">
                                    <button class="add-product-btn changeFoodOrderStatus" data-id="<?php echo $id; ?>">Mark As Complete</button>
                                </div>
                                
                            </div>
                            <div class="header-sub-content">
                                <?php
                                    $timestamp = strtotime($json_data['FoodOrder']['created']);
                                    echo date("M d Y", $timestamp) ." at ";
                                    echo date("h:i a", $timestamp);
                                ?>
                            </div>
                            
                        </div>
                    </div>
                    <section class="page-content-card-container">
                        
                        <div style="margin-left: -20px;">
                            <div class="items-card-container">
                                <div class="items-card-header p-0">
                                    <div class="item-card-body-content pb-0">
                                        <h2 class="descriptionTitle">Order Description</h2>
                                    </div>
                                    <div class="item-card-body-container b--top" style="padding:0px">

                                    <?php
                                        if(is_array($json_data) || is_object($json_data)) 
                                        { 
                                            foreach($json_data['FoodOrderMenuItem'] as $singleRow)
                                            {
                                                ?>
                                                    <div class="item-card-body-container" style="border-bottom: 1px solid rgb(225 227 229);"> 
                                                        <!--<strong>Order Name</strong>-->
                                                        <div class="orderDetail">
                                                            <div>
                                                                <?php echo ucfirst($singleRow['name']);?>
                                                                <p> Quantity: <?php echo $singleRow['quantity'];?></p>
                                                            </div>  
                                                            <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $singleRow['price'];?></p>
                                                        </div>
                                                        
                                                    </div>
                                                    <?php 
                                                    foreach($singleRow['FoodOrderMenuExtraItem'] as $row)
                                                    {
                                                        ?>
                                                            <div class="sub-item-card-body-container">
                                                                <!--<strong>Extra Item</strong>-->
                                                                <div class="orderDetail">
                                                                    <div>
                                                                        <span style="font-weight: bold;"><?php echo $row['quantity'];?></span>
                                                                        x <?php echo $row['name'];?>
                                                                    </div>
                                                                    <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $row['price'];?></p>
                                                                </div>
                                                                
                                                            </div>
                                                        <?php
                                                    }  
                                            }
                                        }
                                    ?> 

                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        
                        <div style="margin-left: -20px;">
                            <div class="items-card-container">
                                <div class="items-card-header p-0">
                                    <div class="item-card-body-content pb-0">
                                        <h2 class="descriptionTitle">Payment Summery</h2>
                                    </div>
                                    <div class="item-card-body-container b--top" style="padding:0px">

                                        <div class="payment-card-body-container"> 
                                            <div class="orderDetail">
                                                <div>
                                                    Subtotal                                                                
                                                </div>  
                                                <p>
                                                    <?php
                                                        echo count($json_data['FoodOrderMenuItem'])." items";
                                                    ?>
                                                </p>
                                                <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $json_data['FoodOrder']['sub_total']; ?></p>
                                            </div>
                                        </div>
                                        
                                        <div class="payment-card-body-container"> 
                                            <div class="orderDetail">
                                                <div>
                                                    Delivery Fee                                                                
                                                </div>  
                                                <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $json_data['FoodOrder']['delivery_fee']; ?></p>
                                            </div>
                                        </div>
                                        
                                        <div class="payment-card-body-container"> 
                                            <div class="orderDetail">
                                                <div>
                                                    Discount                                                                 
                                                </div>  
                                                <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $json_data['FoodOrder']['discount']; ?></p>
                                            </div>
                                        </div>
                                        
                                        <div class="payment-card-body-container"> 
                                            <div class="orderDetail">
                                                <div>
                                                    Payment Type                                                                 
                                                </div>  
                                                <p>
                                                    <?php
                                                        if($json_data['FoodOrder']['cod']=="1")
                                                        {
                                                            echo "Cash On Delivery";
                                                        }
                                                        else
                                                        {
                                                            echo "Credit Card";
                                                        }
                                                    ?>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div class="payment-card-body-container" style="border-bottom: 1px solid rgb(225 227 229);"> 
                                            <div class="orderDetail">
                                                <div>
                                                    Total                                                                 
                                                </div>  
                                                <p> <?php echo $_SESSION[PRE_FIX.'currency_symbol']; ?><?php echo $json_data['FoodOrder']['price']; ?></p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        
                        
                        
                        <div style="margin-left: -20px;">
                        	<div class="leave-comment-header">
                        		<h2>Order Tracking</h2>
                        		<!--<div class="leave-coment-header-check-box">-->
                        		<!--	<input type="checkbox" id="comment">-->
                        		<!--	<label for="comment">Show comments</label>-->
                        		<!--</div>-->
                        	</div>
                        	<div class="leave-comment-body-container">
		                        
                        		<div class="leave-comment-body-content">
                        		    
                        		    <!--<div class="leave-comment-body-header">-->
                              <!--          <div class="leave-comment-img">-->
                              <!--              <svg viewBox="0 0 40 40"><text x="50%" y="50%" dy="0.35em" fill="currentColor" font-size="20" text-anchor="middle">wh</text></svg>-->
                              <!--          </div>-->
                              <!--          <div class="leave-comment-feild-container">-->
                              <!--              <div class="leave-comment-input">-->
                              <!--                  <input type="text" placeholder="Leave a comment...">-->
                              <!--                  <button>-->
                              <!--                      <i class="far fa-smile"></i>-->
                              <!--                  </button>-->
                              <!--                  <button>-->
                              <!--                      <i class="far fa-at"></i>-->
                              <!--                  </button>-->
                              <!--                  <button>-->
                              <!--                      <i class="far fa-hashtag"></i>-->
                              <!--                  </button>-->
                              <!--                  <button>-->
                              <!--                      <i class="far fa-paperclip"></i>-->
                              <!--                  </button>-->
                              <!--                  <button class="comment-post-btn">Post</button>-->
                              <!--              </div>-->
                              <!--              <p class="leave-comment-input-text">Only you and other staff can see comments</p>-->
                              <!--          </div>-->
                              <!--      </div>-->
                        		    
                        			<ul>
                        			    
                        			    <?php
                        			                // order status
                        			                if($json_data['FoodOrder']['status'] == "3")
                        			                {
                                                        $orderStatus="Order has been cancelled by the admin";
                                                        $dateTime=$json_data['FoodOrder']['status_datetime'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        Admin                                                               
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $orderStatus;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                                                    
                                                    if($json_data['FoodOrder']['status'] == "2")
                        			                {
                                                        $orderStatus="Order has been completed";
                                                        $dateTime=$json_data['FoodOrder']['status_datetime'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        System                                                               
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $orderStatus;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                        			    
                        			        if(count($json_data['RiderOrderLog'])!="0") 
                        			        {
                        			            foreach($json_data['RiderOrderLog'] as $singleRow)
                        			            {
                        			                
                        			                if($singleRow['RiderOrder']['rider_response']=="1")
                        						    {
                        						        $rider_response="Order has been <span style='color:rgb(0, 128, 96, 1);'>accepted</span> by ";
                        						    }
                        						    else
                        						    if($singleRow['RiderOrder']['rider_response']=="2")
                        						    {
                        						        $rider_response="Order has been <span style='color:#f47d7d;'>cancelled</span> by ";
                        						    }
                        						    
                        			                
                        			                
                        			                //   rider status
                        			                if($singleRow['RiderOrder']['delivered'] != "0000-00-00 00:00:00")
                        			                {
                                                        $rider_status="Rider has delivered the order";
                                                        $dateTime=$singleRow['RiderOrder']['delivered'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        <?php
                                                                            echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                        ?>                                                                
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $rider_status;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                                                    
                        			                if($singleRow['RiderOrder']['on_the_way_to_dropoff'] != "0000-00-00 00:00:00")
                        			                {
                                                        $rider_status="Rider is on the way to drop off location";
                                                        $dateTime=$singleRow['RiderOrder']['on_the_way_to_dropoff'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        <?php
                                                                            echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                        ?>                                                                
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $rider_status;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                                                    
                        			                if($singleRow['RiderOrder']['pickup_datetime'] != "0000-00-00 00:00:00")
                        			                {
                                                        $rider_status="Rider has picked up the order";
                                                        $dateTime=$singleRow['RiderOrder']['pickup_datetime'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        <?php
                                                                            echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                        ?>                                                                
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $rider_status;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                                                    
                                                    if($singleRow['RiderOrder']['on_the_way_to_pickup'] != "0000-00-00 00:00:00")
                        			                {
                                                        $rider_status="Rider is on the way for pickup";
                                                        $dateTime=$singleRow['RiderOrder']['on_the_way_to_pickup'];
                                                        ?>
                                                            <li>
                                            					<div class="comment-date">
                                            						<h3 class="next-task">
                                                                        <?php
                                                                            echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                        ?>                                                                
                                                                    </h3>
                                                                    &nbsp;
                                            						<h3 class="date">
                                                                        <?php
                                                                            $timestamp = strtotime($dateTime);
                                                                            echo date("d M Y", $timestamp); 
                                                                        ?>                                                          
                                                                    </h3> 
                                                                </div>
                                            					<div class="conformation-mail">
                                            						<div class="comment-dot"></div>
                                            						    <p class="order-conform-text">
                                                						    <?php
                                                						        echo $rider_status;
                                                                            ?>  
                                                						</p>
                                                						<p>
                                                						    <?php
                                                						        $timestamp = strtotime($dateTime);
                                                                                echo date("h:i a", $timestamp);
                                                						    ?>        
                                                						</p>
                                            				    </div>
                                            				</li>
                                                        <?php
                                                    }
                                                    
                        			                
                        			                ?>
                        			                
                        			                    
                        			                    
                        			                    
                        			                    <?php
                        			                        if($singleRow['RiderOrder']['rider_response']!="0")
                        			                        {
                        			                            ?>
                        			                                <li>
                                                    					<div class="comment-date">
                                                    						<h3 class="next-task">
                                                                                <?php
                                                                                    echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                                ?>                                                                
                                                                            </h3>
                                                                            &nbsp;
                                                    						<h3 class="date">
                                                                                <?php
                                                                                    $timestamp = strtotime($singleRow['RiderOrder']['rider_response_datetime']);
                                                                                    echo date("d M Y", $timestamp); 
                                                                                ?>                                                          
                                                                            </h3> 
                                                                        </div>
                                                    					<div class="conformation-mail">
                                                    						<div class="comment-dot"></div>
                                                    						    <p class="order-conform-text">
                                                        						    <?php
                                                        						        echo $rider_response;
                                                                                        echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                                    ?>  
                                                        						</p>
                                                        						<p>
                                                        						    <?php
                                                        						        $timestamp = strtotime($singleRow['RiderOrder']['rider_response_datetime']);
                                                                                        echo date("h:i a", $timestamp);
                                                        						    ?>        
                                                        						</p>
                                                    				    </div>
                                                    				</li>
                        			                            <?php
                        			                        }
                        			                    ?>
                            			                
                                        				<li>
                                        					<div class="comment-date">
                                         						<h3 class="next-task">
                                                                     System                                                                
                                                                 </h3>
                                                                 &nbsp;
                                         						<h3 class="date">
                                                                     <?php
                                                                         $timestamp = strtotime($singleRow['RiderOrder']['created']);
                                                                         echo date("d M Y", $timestamp);     
                                                                     ?>                                                          
                                                                 </h3> 
                                                             </div>
                                         					<div class="conformation-mail">
                                         						<div class="comment-dot"></div>
                                         						<p class="order-conform-text">
                                         						    Order has been assigned to 
                                         						    <?php
                                                                         echo $singleRow['Rider']['first_name']." ".$singleRow['Rider']['last_name'];
                                                                     ?>  
                                         						</p>
                                         						<p>
                                         						    <?php
                                         						        $timestamp = strtotime($singleRow['RiderOrder']['created']);
                                                                         echo date("h:i a", $timestamp);
                                         						    ?>        
                                         						</p>
                                         					</div>
                                         				</li>
                                        				
                            			            <?php 
                    			                }
                        			        }
                        				?>
                        				
                        			    
                        				<li>
                        					<div class="comment-date">
                        						<h3 class="next-task">
                                                    <?php
                                                        echo $json_data['User']['first_name']." ".$json_data['User']['last_name'];
                                                    ?>                                                                
                                                </h3>
                                                &nbsp;
                        						<h3 class="date">
                                                    <?php
                                                        $timestamp = strtotime($json_data['FoodOrder']['created']);
                                                        echo date("d M Y", $timestamp);     
                                                    ?>                                                          
                                                </h3> 
                                            </div>
                        					<div class="conformation-mail">
                        						<div class="comment-dot"></div>
                        						<p class="order-conform-text">
                        						    <?php
                                                        echo $json_data['User']['first_name']." ".$json_data['User']['last_name'];
                                                    ?>  
                                                    placed this order from mobile app
                        						</p>
                        						<p>
                        						    <?php
                        						        $timestamp = strtotime($json_data['FoodOrder']['created']);
                                                        echo date("h:i a", $timestamp);
                        						    ?>        
                        						</p>
                        					</div>
                        				</li>
                        			</ul>
                        		</div>
                        	</div>
                        </div>
                        
                        
                        <div class="right-sec-card-container">
                            
                            <?php
                                if(count($json_data['RiderOrder'])!="0") 
                                {
                                    ?>
                                        <div class="items-card-container">
                                            <div class="item-card-body-container b--top">
                                                <div class="item-card-body-content">
                                                    <h3>RIDER NAME</h3>
                                                    
                                                </div>
                                                <div class="item-note" style="align-items: flex-start;">
                                                    <div class="shipping-address"> 
                                                        <?php  
                                                            $name = strtolower($json_data['RiderOrder']['Rider']['first_name'].' '.$json_data['RiderOrder']['Rider']['last_name']);
                                                            echo ucwords($name);
                                                        ?>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="item-card-body-container b--top">
                                                <div class="item-card-body-content">
                                                    <h3>CONTACT INFORMATION</h3>
                                                </div>
                                                <div class="item-note">
                                                    <?php
                                                        echo $json_data['RiderOrder']['Rider']['phone'].'<br>';   
                                                    ?>
                                                    <a href="#"><?php echo $json_data['RiderOrder']['Rider']['email'];?></a>
                                                </div>
                                            </div>
                                            <div class="item-card-body-container b--top">
                                                <div class="item-card-body-content">
                                                    <h3>VEHICLE</h3>
                                                </div>
                                                <div class="item-note" style="align-items: flex-start;">
                                                    <div class="shipping-address">
                                                        <?php 
                                                            echo $json_data['RiderOrder']['Rider']['Vehicle']['license_plate'];
                                                        ?>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="item-card-body-container b--top">
                                                <div class="item-card-body-content">
                                                    <h3>created</h3>
                                                </div>
                                                <div class="item-note" style="align-items: flex-start;">
                                                    <div class="shipping-address">
                                                        <?php                 
                                                            $timestamp = strtotime($json_data['User']['created']);
                                                            echo date("d M Y h:i a", $timestamp);
                                                        ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    <?php        
                                }
                                else
                                {
                                    ?>
                                        <div class="items-card-container">
                                            <div class="item-card-body-container b--top">
                                                <div class="item-card-body-content">
                                                    <h3>Assign Rider</h3>
                                                    
                                                </div>
                                                <div class="item-note" style="align-items: flex-start;">
                                                    <a href="#" class="assignRider" data-id="<?php echo $id; ?>">Assign Rider</a>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    <?php
                                }
                                
                            ?>
                            
                            <div class="items-card-container">
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>Customer Name</h3>
                                        
                                    </div>
                                    <div class="item-note" style="align-items: flex-start;">
                                        <div class="shipping-address"> 
                                            <?php  
                                                $name = strtolower($json_data['User']['first_name'].' '.$json_data['User']['last_name']);
                                                echo ucwords($name);
                                            ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>CONTACT INFORMATION</h3>
                                    </div>
                                    <div class="item-note">
                                        <?php
                                            echo $json_data['User']['phone'].'<br>';   
                                        ?>
                                        <a href="#"><?php echo $json_data['User']['email'];?></a>
                                    </div>
                                </div>
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>ADDRESS</h3>
                                    </div>
                                    <div class="item-note" style="align-items: flex-start;">
                                        <div class="shipping-address">
                                            <?php 
                                                $address = strtolower($json_data['UserPlace']['location_string']);
                                                echo ucwords($address);
                                            ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>created</h3>
                                    </div>
                                    <div class="item-note" style="align-items: flex-start;">
                                        <div class="shipping-address">
                                            <?php                 
                                                $timestamp = strtotime($json_data['User']['created']);
                                                echo date("d M Y h:i a", $timestamp);
                                            ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="items-card-container">
                                <div class="item-card-body-container">
                                    <div class="item-card-body-content">
                                        <h3>Restaurant</h3>
                                    </div>
                                    <div class="item-note">
                                        <?php  
                                            $name = strtolower($json_data['Restaurant']['name']);
                                            echo ucwords($name);
                                        ?>
                                    </div>
                                </div>
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>CONTACT INFORMATION</h3>
                                    </div>
                                    <div class="item-note">
                                        <?php
                                            echo $json_data['Restaurant']['User']['phone'].'<br>';   
                                        ?>
                                        <a href="#"><?php echo $json_data['Restaurant']['User']['email'];?></a>
                                    </div>
                                </div>
                                
                                <div class="item-card-body-container b--top">
                                    <div class="item-card-body-content">
                                        <h3>ADDRESS</h3>
                                    </div>
                                    <div class="item-note" style="align-items: flex-start;">
                                        <div class="shipping-address">
                                            <a href="https://maps.google.com/maps?q=+<?php echo $json_data['Restaurant']['lat'].",".$json_data['Restaurant']['long'];?>" target="_blank">Get On Map</a>
                                        </div>
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
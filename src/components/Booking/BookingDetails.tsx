import React, { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../../styles/Booking/BookingDetails.module.css";
// import Y2 from "../../assets/Yatch/Y2.svg";
import { yachtAPI } from '../../api/yachts';
import { useLocation, useNavigate } from "react-router-dom";
import { Yacht } from "../../types/yachts";
import { motion, AnimatePresence } from 'framer-motion';


interface FormData {
    startDate: Date | null;
    startTime: Date | null;
    location: string;
    YachtType: string;
    capacity: number;
    PeopleNo: string;
    addonServices: string[];
    packages: string;
    specialRequest: string;
    yacht: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}

interface PriceCalculation {
    addonServicesTotal: number;
    packageTotal: number;
    totalPrice: number;
  }

const BookingDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { yachtId } = location.state || {};
    const [yachtData, setYachtData] = useState<Yacht | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [priceDetails, setPriceDetails] = useState<PriceCalculation>({
      addonServicesTotal: 0,
      packageTotal: 0,
      totalPrice: 0
    });
  const [currentIndex, setCurrentIndex] = useState(0);


    const [isPeak, setIsPeak] = useState(true);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);

    const isWithinWorkingHours = (timeStr: string): boolean => {
      // Expecting the format "HH:MM AM/PM" (e.g., "11:00 AM")
      const [time, period] = timeStr.trim().split(" ");
      if (!time || !period) {
        throw new Error("Invalid time format. Expected format 'HH:MM AM/PM'");
      }
      
      const [hourStr, minuteStr] = time.split(":");
      let hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);
      
      // Convert to 24-hour format
      if (period.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
      }
      if (period.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }
      
      // Calculate total minutes from midnight for the input time
      const totalMinutes = hours * 60 + minutes;
      
      // Define the working hours range in minutes (8:00 AM to 5:00 PM)
      const startMinutes = 8 * 60;   // 480 minutes (8:00 AM)
      const endMinutes = 17 * 60;    // 1020 minutes (5:00 PM)
      
      return totalMinutes >= startMinutes && totalMinutes < endMinutes;
    };

    const [formData, setFormData] = useState<FormData>({
        startDate: new Date(),
        startTime: new Date(),
        location: "",
        YachtType: "",
        capacity: 0,
        PeopleNo: "",
        addonServices: [],
        packages: "",
        specialRequest: "",
        yacht: yachtId || "",
        customerName: "",
        customerEmail: "",
        customerPhone: ""
    });

    useEffect(() => {
      if (formData.startTime) {
        // Convert the startTime Date to a string in the format "h:mm aa"
        const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
        const timeStr = formData.startTime.toLocaleTimeString('en-US', options);
        // If the time is within working hours (non-peak), then isPeak should be false.
        setIsPeak(!isWithinWorkingHours(timeStr));
      }
    }, [formData.startTime]);


    useEffect(() => {
        const fetchYachtData = async () => {
          try {
            const response = await yachtAPI.getYachtById(yachtId);
            // @ts-ignore
            const yacht = response.yatch
            setYachtData(yacht);
            // Pre-fill some form fields with yacht data
            setFormData(prev => ({
              ...prev,
              location: yacht.location,
              YachtType: yacht.YachtType,
              capacity: yacht.capacity
            }));
          } catch (error) {
            setError("Failed to fetch yacht details");
            console.error("Error fetching yacht data:", error);
          }
        };
    
        if (yachtId) {
          fetchYachtData();
        }
      }, [yachtId]);

    
      // Convert addon services to Select options
      const addonServicesOptions = yachtData?.addonServices.map(service => ({
        value: service.service,
        label: `${service.service} (₹${service.pricePerHour})`,
        price: service.pricePerHour
      })) || [];

      // Advance the slide every 3 seconds
      useEffect(() => {
        if (!yachtData?.images?.length) return;
        const handle = setInterval(() => {
          setCurrentIndex(prev =>
            prev === yachtData.images.length - 1 ? 0 : prev + 1
          );
        }, 3000);
        return () => clearInterval(handle);
      }, [yachtData?.images]);
    
      // Convert package types to Select options
      const packagesOptions = yachtData?.packageTypes.map(packageType => {
        // Use regex to extract sailing and anchoring times
        const sailingMatch = packageType.match(/^([\d.]+)_hours?_sailing/);
        const anchoringMatch = packageType.match(/([\d.]+)_hours?_anchorage$/);
        
        const sailingTime = sailingMatch ? parseFloat(sailingMatch[1]) : 0;
        const anchoringTime = anchoringMatch ? parseFloat(anchoringMatch[1]) : 0;
        
        const sailingPrice = isPeak ? yachtData.price.sailing.peakTime * sailingTime : yachtData.price.sailing.nonPeakTime * sailingTime;
        const anchoringPrice = isPeak ? yachtData.price.anchoring.peakTime * anchoringTime : yachtData.price.anchoring.nonPeakTime * anchoringTime;
        const totalPrice = sailingPrice + anchoringPrice;
        
        console.log("sailing", sailingPrice);
        console.log("anchoring", anchoringPrice);
      
        return {
          value: packageType,
          label: `${sailingTime} hours sailing + ${anchoringTime} hour anchorage (₹${totalPrice})`,
          price: totalPrice
        };
      }) || [];



      // const packagesOptions = yachtData?.packageTypes.map(packageType => {
      //   const [sailingTime, anchoringTime] = packageType.split('_hours_sailing_')
      //     .map(time => parseFloat(time.replace('_hour_anchorage', '')));
        
      //   const sailingPrice = isPeak ? yachtData.price.sailing.peakTime * sailingTime : yachtData.price.sailing.nonPeakTime * sailingTime;
      //   const anchoringPrice = isPeak ? yachtData.price.anchoring.peakTime * anchoringTime : yachtData.price.anchoring.nonPeakTime * anchoringTime;
      //   const totalPrice = sailingPrice + anchoringPrice;
      //   console.log("saling", sailingPrice);
      //   console.log("anchoring", anchoringPrice);
    
      //   return {
      //     value: packageType,
      //     label: `${sailingTime} hours sailing + ${anchoringTime} hour anchorage (₹${totalPrice})`,
      //     price: totalPrice
      //   };
      // }) || [];
    

      const selectStyles = {
          control: (base: any) => ({
              ...base,
              minHeight: "40px",
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: "8px",
              boxShadow: "none",
              padding: "7px",
              fontSize: "18px"
          }),
      };

        // Handler for single select fields
        const handleSingleSelect = (
          selectedOption: { value: string; label: string; price?: number } | null,
          field: keyof FormData
        ) => {
          setFormData(prev => ({
            ...prev,
            [field]: selectedOption ? selectedOption.value : "",
          }));
        
          // Update price calculation for packages
          if (field === 'packages') {
            // Use 0 as default if price is undefined
            const packagePrice = selectedOption?.price ?? 0;
        
            setPriceDetails(prev => ({
              ...prev,
              packageTotal: packagePrice,
              totalPrice: packagePrice + prev.addonServicesTotal
            }));
          }
        };
      
        // Handler for multi-select fields (addonServices)
        const handleMultiSelect = (
          selectedOptions: readonly { value: string; label: string; price?: number }[],
          field: keyof FormData
        ) => {
          setFormData(prev => ({
            ...prev,
            [field]: selectedOptions.map(option => option.value),
          }));
      
          // Calculate total price for addon services
          const addonTotal = selectedOptions.reduce((total, option) => {
            return total + (option.price || 0);
          }, 0);
      
          setPriceDetails(prev => ({
            ...prev,
            addonServicesTotal: addonTotal,
            totalPrice: addonTotal + prev.packageTotal
          }));
        };

        const parsePackageDuration = (packageStr: string) => {
          if (!packageStr) return { total: 0, sailing: 0, anchorage: 0 };
        
          const lowercaseStr = packageStr.toLowerCase();
          
          // now match 1, 1.5, 2.5, etc.
          const sailingMatch   = lowercaseStr.match(/(\d+(?:\.\d+)?)_hours?_sailing/);
          const anchorageMatch = lowercaseStr.match(/(\d+(?:\.\d+)?)_hours?_anchorage/);
          
          const sailingHours   = sailingMatch   ? parseFloat(sailingMatch[1])   : 0;
          const anchorageHours = anchorageMatch ? parseFloat(anchorageMatch[1]) : 0;
          
          return {
            total:     sailingHours + anchorageHours
          };
        };

        
        useEffect(() => {
          const fetchSlots = async () => {
            if (!formData.startDate || !formData.packages || !yachtId) return;
        
            try {
              // 1. Extract only the Y/M/D from the selected Date
              const selected = formData.startDate;
              const year  = selected.getFullYear();
              const month = selected.getMonth();    // zero-based
              const day   = selected.getDate();
        
              // 2. Build a new Date at UTC-midnight of that day
              const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));
        
              // 3. Format into the “YYYY-MM-DDT00:00:00.000+00:00” form
              const formattedStartDate = utcMidnight
                .toISOString()        // e.g. "2025-05-31T00:00:00.000Z"
                .replace("Z", "+00:00");
        
              console.log("Looking up slots for UTC date:", formattedStartDate);
        
              // 4. Compute totalDuration as before
              const duration = parsePackageDuration(formData.packages);
              const totalDuration = duration.total || 0;
        
              // 5. Call your API
              const response = await yachtAPI.getBookingSlots(
                yachtId,
                formattedStartDate,
                totalDuration
              );
              // @ts-ignore
              setAvailableTimeSlots(response || []);
            } catch (error) {
              console.error("Error fetching available time slots:", error);
            }
          };
        
          fetchSlots();
        }, [formData.startDate, formData.packages, yachtId]);

        const handleSubmit = async () => {
            setError("");
            try {
              setIsLoading(true);
              const year = formData.startDate ? formData.startDate.getFullYear() : "";
              const month = formData.startDate ? String(formData.startDate.getMonth() + 1).padStart(2, '0') : "";
              const day = formData.startDate ? String(formData.startDate.getDate()).padStart(2, '0') : "";
              const formattedDate = formData.startDate ? `${year}-${month}-${day}` : "";
              
              const hours = formData.startTime ? formData.startTime.getHours().toString().padStart(2, '0') : "";
              const minutes = formData.startTime ? formData.startTime.getMinutes().toString().padStart(2, '0') : "";
              const formattedTime = `${hours}:${minutes}`;
        
              const formattedData = {
                ...formData,
                startDate: formattedDate,
                startTime: formattedTime,
                totalPrice: priceDetails.totalPrice,
                customerName: formData.customerName,
                customerEmail: formData.customerEmail,
                customerPhone: formData.customerPhone
            };
            // @ts-ignore
            const response = await yachtAPI.bookYacht(formattedData);
            if (response) {
                navigate('/to-pay', {
                    state: {
            // @ts-ignore
            bookingDetails: response.booking,
            pricingDetail: response,
            // @ts-ignore
            orderId: response.orderId,
            packageTotal: priceDetails.packageTotal,
            addonServicesTotal: priceDetails.addonServicesTotal,
            yacht: yachtData,
                    }
                });
            }
            } catch (error: any) {
            setError(error.response?.data?.message || "Failed to book yacht. Please try again.");
            } finally {
            setIsLoading(false);
             }
        };

    return (
        <div className={styles.comp_body}>
            <div className={styles.yatchBox}>
                <div className={styles.section_head}>Step Closer to Your Yacht Adventure</div>
                <div className={styles.section_head2}>Complete your booking in just a few clicks & get ready for an unforgettable experience!</div>
            </div>
            
            <div
              className={styles.image_box}
              style={{ overflow: 'hidden', position: 'relative' }}
            >
              <AnimatePresence initial={false}>
                <motion.img
                  key={yachtData?.images[currentIndex]}
                  src={yachtData?.images[currentIndex]}
                  alt={`Yacht ${currentIndex + 1}`}
                  className={styles.Y2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </AnimatePresence>
            </div>
            
            <div className={styles.yatchBox}>
                <div className={styles.section_head}>{yachtData?.name  || "Luxury Yacht"}</div>
                <div className={styles.section_head2}>Please mention or edit the details to process</div>
            </div>

            {/* Customer Details Section */}
            <div className={styles.section_head2}>Customer Details</div>
            <div className={styles.location_filt_box}>
                <div className={styles.form_grid}>
                    <div className={styles.form_group}>
                        <label className={styles.form_label}>Name of Customer</label>
                        <input
                            type="text"
                            className={styles.form_input}
                            placeholder="Enter customer name"
                            value={formData.customerName}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                customerName: e.target.value
                            }))}
                            required
                        />
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.form_label}>Contact Number</label>
                        <input
                            type="tel"
                            className={styles.form_input}
                            placeholder="Enter contact number"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                customerPhone: e.target.value
                            }))}
                            required
                        />
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.form_label}>Email ID</label>
                        <input
                            type="email"
                            className={styles.form_input}
                            placeholder="Enter email address"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                customerEmail: e.target.value
                            }))}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Booking Details Section */}
            <div className={styles.section_head2}>Booking Details</div>
            <div className={styles.location_filt_box}>
                        <div className={styles.form_grid}>

          {/* Start Date */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Start Date*</label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date) =>
                setFormData((prev) => ({ ...prev, startDate: date }))
              }
              minDate={new Date()}
              className={styles.date_picker}
              dateFormat="MM/dd/yyyy"
            />
          </div>

          {/* Packages */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Packages*</label>
            <Select
              options={packagesOptions}
              styles={selectStyles}
              value={
                packagesOptions.find((option) => option.value === formData.packages) ||
                null
              }
              onChange={(value) => handleSingleSelect(value, "packages")}
            />
          </div>


          {/* NEW: Start Time using available slots from backend */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Start Time*</label>
            {formData.startDate && formData.packages ?
              <>
              {availableTimeSlots.length > 0 ? (
                <div className={styles.time_slots}>
                  {availableTimeSlots.map((slot, index) => {
                    const slotStart = new Date(slot.startTime);
                    const slotEnd = new Date(slot.endTime);
                    const formattedStart = slotStart.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    const formattedEnd = slotEnd.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, startTime: slotStart }))
                        }
                        style={{
                          margin: "0 5px",
                          padding: "8px 0",
                          backgroundColor:
                            formData.startTime &&
                            formData.startTime.getTime() === slotStart.getTime()
                              ? "#007BFF"
                              : "#f5f5f5",
                          color:
                            formData.startTime &&
                            formData.startTime.getTime() === slotStart.getTime()
                              ? "#fff"
                              : "#000",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          width: "90%",
                        }}
                      >
                        {formattedStart} - {formattedEnd}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.form_input2}>Not available</div>
              )} </> : 
              <div className={styles.form_input3}>Select Time</div>
            }
          </div>

          {/* Location (Read-only) */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Location</label>
            <input
              type="text"
              className={styles.form_input}
              value={yachtData?.location}
              disabled
            />
          </div>

          {/* Yacht Type (Read-only) */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Yacht Type</label>
            <input
              type="text"
              className={styles.form_input}
              value={yachtData?.YachtType}
              disabled
            />
          </div>

          {/* Yacht Capacity (Read-only) */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Yacht Capacity</label>
            <input
              type="number"
              className={styles.form_input}
              value={yachtData?.capacity}
              disabled
            />
          </div>

          {/* Number of People */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Number of People*</label>
            <input
              type="number"
              min="1"
              max={yachtData?.capacity}
              className={styles.form_input}
              placeholder="Enter number of people"
              value={formData.PeopleNo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, PeopleNo: e.target.value }))
              }
            />
          </div>

          {/* Addon Services */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>Addon Services</label>
            <Select
              options={addonServicesOptions}
              styles={selectStyles}
              isMulti
              value={addonServicesOptions.filter((option) =>
                formData.addonServices.includes(option.value)
              )}
              onChange={(value) => handleMultiSelect(value, "addonServices")}
            />
          </div>
        </div>
       
               {/* Price Summary
               <div className={styles.price_summary}>
                 <h3>Price Summary</h3>
                 <div className={styles.price_details}>
                   <p>Package Price: ${priceDetails.packageTotal}</p>
                   <p>Addon Services: ${priceDetails.addonServicesTotal}</p>
                   <p className={styles.total_price}>Total Price: ${priceDetails.totalPrice}</p>
                 </div>
               </div> */}
       
               <button onClick={handleSubmit} className={styles.submit_button} disabled={isLoading}>
                 {isLoading ? "Loading..." : "Confirm & Continue"}
               </button>
               {error && <div className={styles.error_message}>{error}</div>}
             </div>
        </div>
    );
};

export default BookingDetails;


// import React, { useState } from "react";
// import Select, { SingleValue } from "react-select";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import styles from "../../styles/Booking/BookingDetails.module.css";
// import Y2 from "../../assets/Yatch/Y2.svg";
// import { yachtAPI } from '../../api/yachts';
// import { useLocation, useNavigate } from "react-router-dom";

// interface SelectOption {
//     value: string;
//     label: string;
// }

// interface TimeSelectOption {
//     value: number;
//     label: string;
// }

// interface FormData {
//     startDate: Date | null;
//     startTime: Date | null;
//     duration: number | null;
//     location: SelectOption | null;
//     specialRequest: string;
//     PeopleNo: number;
//     specialEvent: SelectOption | null;
//     sailingTime: number | null;
//     stillTime: number | null;
//     user: string;
//     yacht: string;
//     customerName: string;
//     customerEmail: string;
//     customerPhone: string;
// }

// const priceRanges: TimeSelectOption[] = [
//     { value: 1, label: "1 hours" },
//     { value: 2, label: "2 hours" },
//     { value: 5, label: "5 hours" },
//     { value: 6, label: "6 hours" },
// ];

// const pickupPoints: SelectOption[] = [
//     { value: "Miami", label: "Dubai Marina" },
//     { value: "marina2", label: "Palm Jumeirah" },
//     { value: "marina3", label: "Dubai Harbour" },
//     { value: "marina4", label: "Port Rashid" },
// ];

// const TripDuration: TimeSelectOption[] = [
//     { value: 4, label: "Hourly Charter" },
//     { value: 6, label: "Half Day" },
//     { value: 8, label: "Full Day" },
//     { value: 12, label: "Overnight" },
// ];

// const specialEvents: SelectOption[] = [
//     { value: "birthday", label: "Birthday" },
//     { value: "anniversary", label: "Anniversary" },
//     { value: "corporate", label: "Corporate Event" },
//     { value: "party", label: "Party" },
// ];

// const BookingDetails: React.FC = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { yachtId, yachtName, yacht } = location.state || {};

//     const [formData, setFormData] = useState<FormData>({
//         startDate: new Date(),
//         startTime: new Date(),
//         duration: null,
//         location: null,
//         specialRequest: "",
//         PeopleNo: 0,
//         specialEvent: null,
//         sailingTime: null,
//         stillTime: null,
//         user: "67804200f812512075e49d7d",
//         yacht: yachtId || "",
//         customerName: "",
//         customerEmail: "",
//         customerPhone: ""
//     });

//     const selectStyles = {
//         control: (base: any) => ({
//             ...base,
//             minHeight: "40px",
//             backgroundColor: "#f5f5f5",
//             border: "none",
//             borderRadius: "8px",
//             boxShadow: "none",
//             padding: "7px",
//             fontSize: "18px"
//         }),
//     };

//     const handleSingleSelect = (
//         value: SingleValue<SelectOption>,
//         field: keyof FormData
//     ) => {
//         setFormData((prev) => ({
//             ...prev,
//             [field]: value,
//         }));
//     };

//     const handleTimeSelect = (
//         value: SingleValue<TimeSelectOption>,
//         field: 'duration' | 'sailingTime' | 'stillTime'
//     ) => {
//         setFormData((prev) => ({
//             ...prev,
//             [field]: value ? value.value : null,
//         }));
//     };

//     const handleSubmit = async () => {
//         try {
//             const formattedDate = formData.startDate ? formData.startDate.toISOString().split('T')[0] : "";
//             const hours = formData.startTime ? formData.startTime.getHours().toString().padStart(2, '0') : "";
//             const minutes = formData.startTime ? formData.startTime.getMinutes().toString().padStart(2, '0') : "";
//             const formattedTime = `${hours}:${minutes}`;

//             const formattedData = {
//                 startDate: formattedDate,
//                 startTime: formattedTime,
//                 duration: formData.duration || 0,
//                 location: formData.location?.value || "",
//                 specialRequest: formData.specialRequest,
//                 PeopleNo: formData.PeopleNo,
//                 specialEvent: formData.specialEvent?.value || "",
//                 sailingTime: formData.sailingTime || 0,
//                 stillTime: formData.stillTime || 0,
//                 user: formData.user,
//                 yacht: formData.yacht,
//                 customerName: formData.customerName,
//                 customerEmail: formData.customerEmail,
//                 customerPhone: formData.customerPhone
//             };
// // @ts-ignore
//             const response = await yachtAPI.bookYacht(formattedData);
//             if (response) {
//                 navigate('/to-pay', {
//                     state: {
//                         // @ts-ignore
//                         bookingDetails: response.booking,
//                         // @ts-ignore
//                         orderId: response.orderId
//                     }
//                 });
//             }
//         } catch (error) {
//             console.error('Booking failed:', error);
//         }
//     };

//     return (
//         <div className={styles.comp_body}>
//             <div className={styles.yatchBox}>
//                 <div className={styles.section_head}>Step Closer to Your Yacht Adventure</div>
//                 <div className={styles.section_head2}>Complete your booking in just a few clicks & get ready for an unforgettable experience!</div>
//             </div>
            
//             <div className={styles.image_box}>
//                 <img src={yacht?.images?.[0] || Y2} alt="Yacht" className={styles.Y2} />
//             </div>
            
//             <div className={styles.yatchBox}>
//                 <div className={styles.section_head}>{yachtName || "Luxury Yacht"}</div>
//                 <div className={styles.section_head2}>Please mention or edit the details to process</div>
//             </div>

//             {/* Customer Details Section */}
//             <div className={styles.section_head2}>Customer Details</div>
//             <div className={styles.location_filt_box}>
//                 <div className={styles.form_grid}>
//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Name of Customer</label>
//                         <input
//                             type="text"
//                             className={styles.form_input}
//                             placeholder="Enter customer name"
//                             value={formData.customerName}
//                             onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 customerName: e.target.value
//                             }))}
//                             required
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Contact Number</label>
//                         <input
//                             type="tel"
//                             className={styles.form_input}
//                             placeholder="Enter contact number"
//                             value={formData.customerPhone}
//                             onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 customerPhone: e.target.value
//                             }))}
//                             required
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Email ID</label>
//                         <input
//                             type="email"
//                             className={styles.form_input}
//                             placeholder="Enter email address"
//                             value={formData.customerEmail}
//                             onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 customerEmail: e.target.value
//                             }))}
//                             required
//                         />
//                     </div>
//                 </div>
//             </div>

//             {/* Booking Details Section */}
//             <div className={styles.section_head2}>Booking Details</div>
//             <div className={styles.location_filt_box}>
//                 <div className={styles.form_grid}>
//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Start Date</label>
//                         <DatePicker
//                             selected={formData.startDate}
//                             onChange={(date: Date | null) => setFormData(prev => ({
//                                 ...prev,
//                                 startDate: date
//                             }))}
//                             minDate={new Date()}
//                             className={styles.date_picker}
//                             dateFormat="MM/dd/yyyy"
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Start Time</label>
//                         <DatePicker
//                             selected={formData.startTime}
//                             onChange={(time: Date | null) => setFormData(prev => ({
//                                 ...prev,
//                                 startTime: time
//                             }))}
//                             showTimeSelect
//                             showTimeSelectOnly
//                             timeIntervals={30}
//                             timeCaption="Time"
//                             dateFormat="h:mm aa"
//                             className={styles.date_picker}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Trip Duration</label>
//                         <Select
//                             options={TripDuration}
//                             styles={selectStyles}
//                             value={TripDuration.find(option => option.value === formData.duration) || null}
//                             onChange={(value) => handleTimeSelect(value as SingleValue<TimeSelectOption>, 'duration')}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Pickup Point</label>
//                         <Select
//                             options={pickupPoints}
//                             styles={selectStyles}
//                             value={formData.location}
//                             onChange={(value) => handleSingleSelect(value, 'location')}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Number of People</label>
//                         <input
//                             type="number"
//                             min="1"
//                             className={styles.form_input}
//                             placeholder="Enter number of people"
//                             value={formData.PeopleNo}
//                             onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 PeopleNo: parseInt(e.target.value) || 0
//                             }))}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Sailing Time</label>
//                         <Select
//                             options={priceRanges}
//                             styles={selectStyles}
//                             value={priceRanges.find(option => option.value === formData.sailingTime) || null}
//                             onChange={(value) => handleTimeSelect(value as SingleValue<TimeSelectOption>, 'sailingTime')}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Still Time</label>
//                         <Select
//                             options={priceRanges}
//                             styles={selectStyles}
//                             value={priceRanges.find(option => option.value === formData.stillTime) || null}
//                             onChange={(value) => handleTimeSelect(value as SingleValue<TimeSelectOption>, 'stillTime')}
//                         />
//                     </div>

//                     <div className={styles.form_group}>
//                         <label className={styles.form_label}>Special Events</label>
//                         <Select
//                             options={specialEvents}
//                             styles={selectStyles}
//                             value={formData.specialEvent}
//                             onChange={(value) => handleSingleSelect(value, 'specialEvent')}
//                         />
//                     </div>

//                     <div className={`${styles.form_group} ${styles.special_requests}`}>
//                         <label className={styles.form_label}>Special Requests</label>
//                         <textarea
//                             className={styles.textarea}
//                             rows={3}
//                             placeholder="Enter any special requests or requirements"
//                             value={formData.specialRequest}
//                             onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 specialRequest: e.target.value
//                             }))}
//                         />
//                     </div>
//                 </div>
//                 <button onClick={handleSubmit} className={styles.submit_button}>
//                     Confirm & Continue
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default BookingDetails;
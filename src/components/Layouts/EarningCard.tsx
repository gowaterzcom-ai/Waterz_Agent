import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/Layouts/EarningCard.module.css';
import { useUserStatus } from '../../hooks/useUserStatus';

interface YachtCardProps {
    name: string;
    capacity: number;
    startingPrice: string;
    imageUrl: string;
    yachtId: string;
    isPrev?: boolean;
    isEarning?: boolean;
}

const EarningCard: React.FC<YachtCardProps> = ({ 
    name, 
    capacity, 
    startingPrice, 
    imageUrl, 
    yachtId, 
    isPrev, 
    isEarning = false 
}) => {

    const { userDetails } = useUserStatus();
    // console.log("user details", userDetails)
    const navigate = useNavigate();

    const handleBookNow = () => {
        navigate(`/yatch-details/${yachtId}`, { state: { isPrev } });
    };

    const commission = userDetails?.commissionRate || 0; 
    const commissionRate = commission/100;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h2 className={styles.name}>{name}</h2>
                {isEarning ? (
                    <p className={styles.capacity}>Date: {startingPrice}</p>
                ) : (
                    <p className={styles.capacity}>Capacity: {capacity} guests</p>
                )}
            </div>
            <div className={styles.imageContainer}>
                <img src={imageUrl} alt={name} className={styles.image} />
                {!isPrev && !isEarning && (
                    <div className={styles.priceTag}>Starting at ₹{startingPrice}</div>
                )}
            </div>
            {isEarning ? (
                <button className={styles.bookButton}>
                   Earning: ₹{Math.round(capacity * commissionRate)}
                </button>
            ) : (
                <button className={styles.bookButton} onClick={handleBookNow}>
                    View Details
                </button>
            )}
        </div>
    );
};

export default EarningCard;

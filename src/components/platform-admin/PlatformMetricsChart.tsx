"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components required for bar charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Interface defining the structure for monthly user data
interface MonthlyData {
  month: string; // Month abbreviation (e.g., "Jan", "Feb")
  users: number; // Number of users registered in that month
}

/**
 * Platform metrics chart component that displays user growth over the last 8 months
 * Shows a bar chart with monthly user registrations and calculates growth rate
 */
const PlatformMetricsChart = () => {
  // State for storing monthly user registration data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  // Total number of users in the selected time period
  const [totalUsers, setTotalUsers] = useState<number>(0);
  // Month-over-month growth rate percentage
  const [growthRate, setGrowthRate] = useState<number>(0);
  // Loading state for data fetching
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    /**
     * Fetches user registration data from Firestore for the last 8 months
     * Calculates monthly user counts and growth rate
     */
    const fetchUserGrowthData = async () => {
      try {
        setIsLoading(true);
        
        // Calculate the date 8 months ago from current date
        const eightMonthsAgo = new Date();
        eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
        
        // Query users created within the last 8 months, ordered by creation date
        const usersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(eightMonthsAgo)),
          orderBy('createdAt', 'asc')
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        // Object to store user counts by month-year key
        const usersByMonth: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const currentDate = new Date();
        const monthsData = [];
        
        // Initialize data structure for the last 8 months with zero counts
        for (let i = 0; i < 8; i++) {
          const date = new Date();
          date.setMonth(currentDate.getMonth() - (7 - i)); // Calculate month going backwards
          const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
          usersByMonth[monthKey] = 0; // Initialize with zero users
          
          monthsData.push({
            key: monthKey,
            date: new Date(date),
            monthIndex: date.getMonth(),
            year: date.getFullYear()
          });
        }
        
        let totalUserCount = 0;
        // Process each user document and count by month
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          const createdAt = userData.createdAt?.toDate() as Date;
          
          if (createdAt) {
            // Create month-year key for grouping users
            const monthKey = `${monthNames[createdAt.getMonth()]}-${createdAt.getFullYear()}`;
            // Increment user count for this month (fallback to 0 if key doesn't exist)
            usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
            totalUserCount++;
          }
        });
        
        // Transform data into chart-friendly format (month name only, no year)
        const chartData: MonthlyData[] = monthsData.map(monthData => ({
          month: monthData.key.split('-')[0], // Extract month abbreviation
          users: usersByMonth[monthData.key]
        }));
        
        // Calculate month-over-month growth rate
        const lastMonthUsers = chartData[chartData.length - 1]?.users || 0;
        const previousMonthUsers = chartData[chartData.length - 2]?.users || 0;
        
        let calculatedGrowthRate = 0;
        if (previousMonthUsers > 0) {
          // Standard percentage growth calculation
          calculatedGrowthRate = ((lastMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
        } else if (previousMonthUsers === 0 && lastMonthUsers > 0) {
          // Edge case: first users registered (100% growth)
          calculatedGrowthRate = 100;
        } else {
          // No growth or no users in either month
          calculatedGrowthRate = 0;
        }
        
        setMonthlyData(chartData);
        setTotalUsers(totalUserCount);
        setGrowthRate(parseFloat(calculatedGrowthRate.toFixed(1)));
      } catch (error) {
        console.error('Error fetching user growth data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserGrowthData();
  }, []);

  // Chart.js data configuration for the bar chart
  const chartData: ChartData<'bar'> = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'User Growth',
        data: monthlyData.map(item => item.users),
        // Highlight the most recent month with darker color
        backgroundColor: monthlyData.map((_, index) => 
          index === monthlyData.length - 1 
            ? 'rgba(59, 130, 246, 0.9)' // Current month - darker blue
            : 'rgba(96, 165, 250, 0.7)' // Previous months - lighter blue
        ),
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  // Chart.js configuration options for styling and behavior
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      tooltip: {
        // Dark theme tooltip styling
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgba(243, 244, 246, 1)',
        bodyColor: 'rgba(243, 244, 246, 1)',
        padding: 12,
        cornerRadius: 4,
        displayColors: false, // Hide color indicator in tooltip
        callbacks: {
          // Custom tooltip title showing month and current year
          title: (tooltipItems) => {
            return `${tooltipItems[0].label} ${new Date().getFullYear()}`;
          },
          // Custom tooltip label with formatted user count
          label: (context) => {
            return `Users: ${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false, // Hide vertical grid lines for cleaner look
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)', // Gray color for month labels
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true, // Always start Y-axis from zero
        grid: {
          color: 'rgba(243, 244, 246, 0.1)', // Subtle horizontal grid lines
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)', // Gray color for value labels
          font: {
            size: 11,
          },
          // Format large numbers with 'k' suffix (e.g., 1.5k instead of 1500)
          callback: (value: string | number) => {
            const numValue = Number(value);
            if (numValue >= 1000) {
              return `${(numValue / 1000).toFixed(numValue >= 10000 ? 0 : 1)}k`;
            }
            return value;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading chart data...</div>
        </div>
      ) : (
        <>
          <div className="h-52">
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className="mt-3 flex justify-between text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Users: <span className="text-gray-900 dark:text-white">{totalUsers.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center">
              {growthRate > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500 dark:text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : growthRate < 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500 dark:text-red-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
              <span className="text-gray-700 dark:text-gray-300 font-medium">Growth Rate: <span className={`${growthRate > 0 ? 'text-green-600 dark:text-green-400' : growthRate < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{`${growthRate > 0 ? '+' : ''}${growthRate}%`}</span></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlatformMetricsChart;
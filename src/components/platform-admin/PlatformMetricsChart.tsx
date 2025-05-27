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

interface MonthlyData {
  month: string;
  users: number;
}

const PlatformMetricsChart = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserGrowthData = async () => {
      try {
        setIsLoading(true);
        
        const eightMonthsAgo = new Date();
        eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
        
        const usersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(eightMonthsAgo)),
          orderBy('createdAt', 'asc')
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        const usersByMonth: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const currentDate = new Date();
        const monthsData = [];
        
        for (let i = 0; i < 8; i++) {
          const date = new Date();
          date.setMonth(currentDate.getMonth() - (7 - i));
          const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
          usersByMonth[monthKey] = 0;
          
          monthsData.push({
            key: monthKey,
            date: new Date(date),
            monthIndex: date.getMonth(),
            year: date.getFullYear()
          });
        }
        
        let totalUserCount = 0;
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          const createdAt = userData.createdAt?.toDate() as Date;
          
          if (createdAt) {
            const monthKey = `${monthNames[createdAt.getMonth()]}-${createdAt.getFullYear()}`;
            usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
            totalUserCount++;
          }
        });
        
        const chartData: MonthlyData[] = monthsData.map(monthData => ({
          month: monthData.key.split('-')[0],
          users: usersByMonth[monthData.key]
        }));
        
        
        const lastMonthUsers = chartData[chartData.length - 1]?.users || 0;
        const previousMonthUsers = chartData[chartData.length - 2]?.users || 0;
        
        let calculatedGrowthRate = 0;
        if (previousMonthUsers > 0) {
          calculatedGrowthRate = ((lastMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
        } else if (previousMonthUsers === 0 && lastMonthUsers > 0) {
          calculatedGrowthRate = 100;
        } else {
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

  const chartData: ChartData<'bar'> = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'User Growth',
        data: monthlyData.map(item => item.users),
        backgroundColor: monthlyData.map((_, index) => 
          index === monthlyData.length - 1 
            ? 'rgba(59, 130, 246, 0.9)'
            : 'rgba(96, 165, 250, 0.7)'
        ),
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgba(243, 244, 246, 1)',
        bodyColor: 'rgba(243, 244, 246, 1)',
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            return `${tooltipItems[0].label} ${new Date().getFullYear()}`;
          },
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
          display: false,
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(243, 244, 246, 0.1)',
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 11,
          },
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
import { useEffect, useMemo, useRef } from "react";
import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement } from 'chart.js';
import { useFetchMasters } from "@/hook/fetchMaster";
import { useAppDispatch } from "@/utils/store/store";
import { fetchShipperGroup } from "@/utils/store/slices/shipperGroupSlice";
import { fetchAreaMaster } from "@/utils/store/slices/areaMasterSlice";
import { fetchEntryExit } from "@/utils/store/slices/entryExitSlice";
import annotationPlugin from 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatNumber } from "@/utils/generalFormatter";

ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, annotationPlugin, ChartDataLabels);

interface TableProps {
    dataChart?: any;
    userPermission?: any;
    setFilterDataLongTerm?: any;
    filterDataLongTerm?: any;
}

const ChartLongTerm: React.FC<TableProps> = ({ dataChart, userPermission, filterDataLongTerm, setFilterDataLongTerm }) => {

    let isLoading = true
    // ############### REDUX DATA ###############
    const { areaMaster } = useFetchMasters();
    const [forceRefetch, setForceRefetch] = useState(true);
    const dispatch = useAppDispatch();
    useEffect(() => {
        if (forceRefetch) {
            dispatch(fetchShipperGroup());
            dispatch(fetchAreaMaster());
            dispatch(fetchEntryExit());
        }
        if (forceRefetch) {
            setForceRefetch(false);
        }

    }, [dispatch, areaMaster, forceRefetch]);

    // ############### CHART DATA ###############
    // Extract years
    // const allYears = Array.from(new Set(dataChart.flatMap((item: any) => item.year)));
    // const allYears = dataChart && Array.isArray(dataChart) ? Array.from(new Set(dataChart.flatMap((item: any) => item.year))) : [];

    // // Compute total values for each year
    // const totalValues = allYears.map((year) =>
    //     dataChart.reduce((sum: any, item: any) => {
    //         const yearIndex = item.year.indexOf(year);
    //         return sum + (yearIndex !== -1 ? item.value[yearIndex] : 0);
    //     }, 0)
    // );

    // const datasets = Array.isArray(dataChart)
    //     ? dataChart.map((item: any) => ({
    //         // label: item.nomination_point,
    //         label: item.area?.name,
    //         data: allYears.map((year) => {
    //             const yearIndex = item.year.indexOf(year);
    //             return yearIndex !== -1 ? item.value[yearIndex] : 0;
    //         }),
    //         backgroundColor: item.area.color,
    //         maxBarThickness: 100, // Make bars wider
    //     }))
    //     : [];

    const allYears = useMemo(() => {
        return dataChart && Array.isArray(dataChart) ? Array.from(new Set(dataChart.flatMap((item: any) => item.year))) : [];
    }, [dataChart]);

    const totalValues = useMemo(() => {
        return allYears.map((year) =>
            dataChart.reduce((sum: any, item: any) => {
                const yearIndex = item.year.indexOf(year);
                return sum + (yearIndex !== -1 ? item.value[yearIndex] : 0);
            }, 0)
        );
    }, [dataChart, allYears]);

    const datasets = useMemo(() => {
        return Array.isArray(dataChart)
            ? dataChart.map((item: any) => {
                return {
                    label: item.area?.name,
                    data: allYears.map((year) => {
                        const yearIndex = item.year.indexOf(year);
                        return yearIndex !== -1 ? item.value[yearIndex] : 0;
                    }),
                    backgroundColor: item.area.color,
                    maxBarThickness: 100,
                    isEntry: item?.entry_exit_id == 1 ? true : false,
                }
            })
            : [];
    }, [dataChart, allYears]);

    // Chart data
    const chartData = {
        labels: allYears,
        datasets: datasets,
    };

    // Chart options
    // const options: any = {
    //     responsive: true,
    //     maintainAspectRatio: false,
    //     plugins: {
    //         legend: {
    //             display: true,
    //             position: "top",
    //             labels: {
    //                 usePointStyle: true,
    //                 // pointStyle: 'circle',
    //                 font: {
    //                     size: 12,
    //                     weight: "bold",
    //                 },
    //                 boxWidth: 20,
    //                 boxHeight: 12,
    //                 padding: 18,
    //                 generateLabels: (chart: any) => {
    //                     return chart.data.datasets.map((dataset: any, index: any) => ({
    //                         text: dataset.label,
    //                         fillStyle: dataset.backgroundColor,
    //                         strokeStyle: dataset.backgroundColor,
    //                         pointStyle: dataset.isEntry ? 'rect' : 'circle', // Custom point style
    //                         hidden: dataset.hidden, // Use dataset's visibility instead of chart.isDatasetVisible
    //                         datasetIndex: index, // Track dataset index for visibility toggle
    //                     }));
    //                 }
    //             },
    //         },
    //         title: {
    //             display: false,
    //             color: '#58585A',
    //             text: 'Total Supply (MMBTU)',
    //             font: {
    //                 size: 15
    //             },
    //             position: 'top',
    //             align: 'start',
    //             zIndex: 5,
    //             padding: {
    //                 top: -1,
    //                 bottom: 1,
    //             },
    //         },
    //         tooltip: {
    //             mode: 'index',
    //             enabled: true,
    //             intersect: false,
    //             backgroundColor: 'white',
    //             title: false,
    //             titleColor: '#767676',
    //             bodyColor: '#767676',
    //             padding: 5,
    //             boxPadding: 5,
    //             usePointStyle: true,
    //             callbacks: {
    //                 title: () => null,
    //                 label: function (tooltipItem: any, data: any) {
    //                     return (tooltipItem?.raw === 0 ? null : tooltipItem?.dataset?.label)
    //                 },
    //                 afterLabel: function (tooltipItem: any, data: any) {
    //                     // return `${formatNumber(tooltipItem?.raw)}`;
    //                     return (tooltipItem?.raw === 0 ? null : formatNumberThreeDecimal(tooltipItem?.raw))
    //                 },
    //                 labelColor: function (context: any) {
    //                     return {
    //                         borderColor: context?.dataset?.backgroundColor,
    //                         backgroundColor: context?.dataset?.backgroundColor,
    //                         borderWidth: 0,
    //                         borderRadius: 2,
    //                     }
    //                 },
    //             },
    //         },
    //         datalabels: {
    //             display: true,
    //             align: "end",
    //             anchor: "end",
    //             formatter: (value: any, context: any) => {
    //                 const totalValueForYear = totalValues[context.dataIndex];
    //                 // Only show labels if total value > 0
    //                 if (totalValueForYear > 0 && context.datasetIndex === chartData.datasets.length - 1) {
    //                     // return formatNumberThreeDecimal(totalValueForYear);
    //                     return formatNumber(totalValueForYear);
    //                     // return totalValueForYear;
    //                 }
    //                 return ""; // Do not display anything for 0 values
    //             },
    //             font: {
    //                 size: 12,
    //                 weight: "light",
    //             },
    //             color: "#0DA2A2",
    //             rotation: (context: any) => {
    //                 const chartWidth = context.chart.width;
    //                 if (chartWidth > 800) {
    //                     return 0;
    //                 } else if (chartWidth > 400) {
    //                     return -45;
    //                 } else {
    //                     return -90;
    //                 }
    //                 // const datasetLength = context.chart.data.datasets[0].data.length;
    //                 // return datasetLength > 15 ? 270 : 0; // Rotate if there are more than 10 data points
    //             },
    //         },
    //         animation: {
    //             onSuccess: () => {
    //                 const chart = ChartJS.getChart('LongtermChart');
    //                 if (chart) {
    //                     const { legend }: any = chart;
    //                     // legend.top = 8;
    //                     legend.top = -15;
    //                 }
    //             },
    //         },
    //     },
    //     scales: {
    //         x: {
    //             stacked: true,
    //             title: {
    //                 display: true,
    //                 text: "Years",
    //             },
    //             grid: {
    //                 display: false, // Remove grid lines on x-axis
    //             },
    //             categoryPercentage: 0.7, // Adjust bar width
    //             barPercentage: 0.9,
    //         },
    //         y: {
    //             stacked: true,
    //             grid: {
    //                 display: false, // Remove grid lines on x-axis
    //             },
    //             title: {
    //                 display: false,
    //                 text: "Values (MMBTUD)",
    //             },
    //         },
    //     },
    // };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    usePointStyle: true,
                    font: {
                        size: 12,
                        weight: "bold",
                    },
                    boxWidth: 20,
                    boxHeight: 12,
                    padding: 18,
                    generateLabels: (chart: any) => {
                        return chart.data.datasets.map((dataset: any, index: any) => ({
                            text: dataset.label,
                            fillStyle: dataset.backgroundColor,
                            strokeStyle: dataset.backgroundColor,
                            pointStyle: dataset.isEntry ? 'rect' : 'circle', // Custom point style
                            hidden: dataset.hidden, // Use dataset's visibility instead of chart.isDatasetVisible
                            datasetIndex: index, // Track dataset index for visibility toggle
                        }));
                    }
                },
                // onClick: (event: any, legendItem: any) => {
                //     const chart = legendItem.chart;
                //     const datasetIndex = legendItem.datasetIndex;
                //     const meta = chart.getDatasetMeta(datasetIndex);

                //     // Toggle the dataset's visibility
                //     meta.hidden = !meta.hidden;

                //     // Re-render the chart after toggling visibility
                //     chart.update();
                // }
                onClick: null
            },
            title: {
                display: false,
                color: '#58585A',
                // text: 'Total Supply (MMBTU)',
                text: 'Total Energy (MMBTU/D)', // v1.0.90 เปลี่ยนหัว Graph จาก "Total Supply (MMBTU)" เป็น "Total Energy (MMBTU/D)" https://app.clickup.com/t/86ert2k26
                font: {
                    size: 15
                },
                position: 'top',
                align: 'start',
                zIndex: 5,
                padding: {
                    top: -1,
                    bottom: 1,
                },
            },
            // tooltip: {
            //     mode: 'index',
            //     enabled: true,
            //     intersect: false,
            //     backgroundColor: 'white',
            //     title: false,
            //     titleColor: '#767676',
            //     bodyColor: '#767676',
            //     padding: 5,
            //     boxPadding: 5,
            //     usePointStyle: true,
            //     callbacks: {
            //         title: () => null,
            //         label: function (tooltipItem: any, data: any) {
            //             return (tooltipItem?.raw === 0 ? null : tooltipItem?.dataset?.label);
            //         },
            //         afterLabel: function (tooltipItem: any, data: any) {
            //             return (tooltipItem?.raw === 0 ? null : formatNumberThreeDecimal(tooltipItem?.raw));
            //         },
            //         labelColor: function (context: any) {
            //             return {
            //                 borderColor: context?.dataset?.backgroundColor,
            //                 backgroundColor: context?.dataset?.backgroundColor,
            //                 borderWidth: 0,
            //                 borderRadius: 2,
            //             };
            //         },
            //     },
            // },
            tooltip: {
                mode: 'index',
                enabled: true,
                intersect: false,
                backgroundColor: 'white',
                titleColor: '#767676',
                bodyColor: '#767676',
                padding: 10,
                boxPadding: 5,
                callbacks: {
                    title: () => null, // Hides the title
                    label: (tooltipItem: any) => {
                        return tooltipItem?.dataset?.label + ': ' + `${formatNumber(tooltipItem?.raw)}`
                    },
                    // label: (tooltipItem: any) => tooltipItem?.dataset?.label || '', // Returns dataset label
                    // // afterLabel: (tooltipItem: any) => `${formatNumber(tooltipItem?.raw)} %`, // Formats value with '%'
                    // afterLabel: (tooltipItem: any) => `${formatNumber(tooltipItem?.raw)}`, // Formats value with '%'
                    labelColor: (context: any) => ({
                        borderColor: context?.dataset?.backgroundColor || '#000',
                        backgroundColor: context?.dataset?.backgroundColor || '#000',
                        borderWidth: 0,
                        borderRadius: 3,
                    }),
                },
            },
            datalabels: {
                display: true,
                align: "end",
                anchor: "end",
                formatter: (value: any, context: any) => {
                    const totalValueForYear = totalValues[context.dataIndex];
                    if (totalValueForYear > 0 && context.datasetIndex === chartData.datasets.length - 1) {
                        // const divide_by_thoudsand = totalValueForYear / 1000
                        // return formatNumber(divide_by_thoudsand);
                        
                        return formatNumber(totalValueForYear);
                    }
                    return ""; // Do not display anything for 0 values
                },
                font: {
                    size: 12,
                    weight: "light",
                },
                // color: "#0DA2A2",
                color: "#000000",
                rotation: (context: any) => {
                    const chartWidth = context.chart.width;
                    // if (chartWidth > 800) {
                    if (chartWidth > 1000) {
                        return 0;
                        // } else if (chartWidth > 400) {
                    } else if (chartWidth <= 1000) {
                        return -45;
                    } else if (chartWidth <= 500) {
                        return -90;
                    }
                },
            },
            animation: {
                onSuccess: () => {
                    const chart = ChartJS.getChart('LongtermChart');
                    if (chart) {
                        const { legend }: any = chart;
                        legend.top = -15;
                    }
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: "Years",
                },
                grid: {
                    display: false, // Remove grid lines on x-axis
                },
                categoryPercentage: 0.7, // Adjust bar width
                barPercentage: 0.9,
            },
            y: {
                stacked: true,
                grid: {
                    display: false, // Remove grid lines on y-axis
                },
                title: {
                    display: false,
                    text: "Values (MMBTUD)",
                },
            },
        },

    };



    // ############### SAVE IMAGE OF CHART ###############
    const chartRef: any = useRef(null); // Create ref for the chart

    const handleSaveImage = () => {
        if (chartRef.current) {
            // Get the canvas element from the chart reference
            const imageURI = chartRef.current.toBase64Image();  // Directly call on chartRef.current
            // Create a temporary <a> element to trigger download
            const link = document.createElement('a');
            link.href = imageURI;
            link.download = 'chart.png'; // Set the default file name
            link.click(); // Trigger the download
        }
    };

    const ChartComponent = useMemo(() => {
        return dataChart && datasets ? <Bar id="LongtermChart" data={chartData} options={options} /> : null;
    }, [dataChart, datasets, chartData, options]);

    return (
        <div className={`h-auto min-h-[300px] overflow-y-auto block rounded-t-md relative z-1 p-2`}>

            <aside className="mt-auto ml-1 w-full sm:w-auto pb-2">
                <div className="flex justify-between w-full">
                    {/* Align text to the left */}
                    {/* <div>
                        <h2 className="text-[16px] font-bold text-[#58585A] ">{`Long term`}</h2>
                    </div> */}

                    {/* Align buttons to the right */}
                    {/* <div className="flex gap-2 justify-end">
                        <BtnGeneral
                            textRender={"Export Image"}
                            iconNoRender={false}
                            modeIcon={'export_image_chart'}
                            bgcolor={"#1473A1"}
                            generalFunc={() => handleSaveImage()}
                            can_export={userPermission ? userPermission?.f_export : false}
                        />
                        <BtnExport textRender={"Export"} />
                    </div> */}
                </div>
            </aside>

            {/* <div className={` h-[350px] p-2 min-w-[${chartData.labels.length > 10 ? '3500px' : '100%'}]`}>
                <div className="font-semibold text-[16px] text-[#58585A] absolute">
                    {`Total Supply (MMBTU)`}
                </div>

                {ChartComponent}
            </div> */}

            <div className="w-full overflow-x-auto overflow-y-hidden ">
                <div
                    className="h-[430px] w-full p-2 "
                    style={{
                        // minWidth: chartData.labels.length > 10 ? `${chartData.labels.length * 50}px` : "100%",
                        // minWidth: chartData.labels.length > 10 ? `${chartData.labels.length * 30}px` : "100%", // เดิมโรงงาน
                        minWidth: chartData.labels.length > 10 ? `${chartData.labels.length * 65}px` : "100%", // ค่าของกราฟขึ้นซ้อนกัน ข้อมูลมากสุดประมาณ หลักล้าน 9,999,999 https://app.clickup.com/t/86evh207k
                    }}
                >
                    <div className="font-semibold text-[16px] text-[#58585A] mb-2">
                        {/* {`Total Supply (MMBTU)`} */}
                        {/* v1.0.90 เปลี่ยนหัว Graph จาก "Total Supply (MMBTU)" เป็น "Total Energy (MMBTU/D)" https://app.clickup.com/t/86ert2k26 */}
                        {`Total Energy (MMBTU/D)`}
                        {/* {`Total Energy (BBTU/D)`} */}
                    </div>

                    {ChartComponent}
                </div>
            </div>


        </div>
    )
}

export default ChartLongTerm;
import Link from 'next/link';

export default function ImagingDashboard() {
  const stats = [
    { label: 'Pending Orders', value: '12', color: 'bg-yellow-500', link: '/imaging/orders?status=PENDING' },
    { label: 'Today\'s Studies', value: '45', color: 'bg-blue-500', link: '/imaging/studies' },
    { label: 'Awaiting Review', value: '8', color: 'bg-purple-500', link: '/imaging/studies?status=READY_FOR_REVIEW' },
    { label: 'Reports to Sign', value: '5', color: 'bg-orange-500', link: '/imaging/reports?status=DRAFT' },
  ];

  const quickActions = [
    { name: 'New Order', href: '/imaging/orders/new', icon: '➕', color: 'bg-blue-600' },
    { name: 'Worklist', href: '/imaging/worklist', icon: '📋', color: 'bg-green-600' },
    { name: 'Viewer', href: '/imaging/viewer', icon: '🖼️', color: 'bg-purple-600' },
    { name: 'Reports', href: '/imaging/reports', icon: '📄', color: 'bg-orange-600' },
  ];

  const recentActivity = [
    { type: 'Study', description: 'CT Chest - Johnson, Sarah', time: '5 min ago', status: 'Completed' },
    { type: 'Report', description: 'MRI Brain - Davis, Michael', time: '15 min ago', status: 'Signed' },
    { type: 'Order', description: 'X-Ray Hand - Martinez, Elena', time: '30 min ago', status: 'Scheduled' },
    { type: 'Study', description: 'Ultrasound Abdomen - Brown, Robert', time: '1 hour ago', status: 'In Progress' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Imaging & PACS</h1>
          <p className="text-gray-600 mt-1">Medical imaging management and radiology workflow</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/imaging/orders/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.link}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`h-1 ${stat.color}`} />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`${action.color} text-white rounded-lg p-6 text-center hover:opacity-90 transition-opacity`}
            >
              <div className="text-4xl mb-2">{action.icon}</div>
              <div className="font-semibold">{action.name}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {activity.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  <span className="text-xs font-medium text-green-600">
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <Link href="/imaging/orders" className="text-sm text-blue-600 hover:text-blue-800">
              View all activity →
            </Link>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Imaging Modules</h2>
          <div className="space-y-3">
            <Link
              href="/imaging/orders"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📝</div>
                <div>
                  <div className="font-medium">Imaging Orders</div>
                  <div className="text-sm text-gray-600">Manage imaging orders and requisitions</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/imaging/studies"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏥</div>
                <div>
                  <div className="font-medium">Studies</div>
                  <div className="text-sm text-gray-600">Browse and review imaging studies</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/imaging/viewer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👁️</div>
                <div>
                  <div className="font-medium">DICOM Viewer</div>
                  <div className="text-sm text-gray-600">Advanced medical image viewer</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/imaging/worklist"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-medium">Worklist</div>
                  <div className="text-sm text-gray-600">Technologist worklist and scheduling</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/imaging/reports"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📋</div>
                <div>
                  <div className="font-medium">Radiology Reports</div>
                  <div className="text-sm text-gray-600">Create and manage radiology reports</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/imaging/modalities"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">⚙️</div>
                <div>
                  <div className="font-medium">Modality Status</div>
                  <div className="text-sm text-gray-600">Monitor imaging equipment</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

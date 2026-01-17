import logo from '@/assets/sweetgifts.svg';

const DesktopWorkInProgressPage = () => {
  return (
    <div className="min-h-screen gold-gradient flex flex-col items-center justify-center px-6 text-center">
      <img src={logo} alt="Sweet Gifts" className="h-32 w-auto" />
      <p className="mt-4 text-2xl font-semibold text-white">In lucru</p>
    </div>
  );
};

export default DesktopWorkInProgressPage;
